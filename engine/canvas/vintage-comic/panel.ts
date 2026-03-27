import type { CanvasBlockStyle } from "../styles/types";
import type { CanvasTokens2d } from "../styles/types";
import type { SlideScene2d } from "../slideScene2d";
import { drawStyledTextLine } from "../shared/textStyle";
import { retroComicCoverBodyFontStack, retroComicRoot } from "./theme";

/**
 * One speech bubble: **text**, **box** in the comic content area, and **tail tip** in the same space.
 * Cloud shape, tail width, twist, stroke, and fill are automatic.
 *
 * **Coordinates** (below the panel title):
 * - `boxNorm`: `x`, `w` are fractions of `innerW` (from `innerLeft`); `y`, `h` are fractions of `contentH` (from `contentTop`).
 * - `tailTip`: **same system** — absolute content-normalized point (not relative to the bubble box):
 *   `tipX = innerLeft + tailTip.x * innerW`, `tipY = contentTop + tailTip.y * contentH`.
 *
 * Configure in `comicPanel.bubbles` (see `presentations/psyche/canvas-scenes.ts`).
 */
export type ComicSpeechBubble = {
  text: string;
  boxNorm: { x: number; y: number; w: number; h: number };
  tailTip: { x: number; y: number };
};

/** Two-character comic panel + arbitrary speech bubbles + figure slots. */
export type ComicPanelMeta = {
  professorSrc: string;
  studentSrc?: string;
  /** Ordered; drawn after figures, each with text + cloud + tail. */
  bubbles: ComicSpeechBubble[];
};

/** Thought cloud + dot trail; `boxNorm` / `tailTip` use the same content coords as comic bubbles. */
export type ComicNarrationThinkBubble = {
  text: string;
  boxNorm: { x: number; y: number; w: number; h: number };
  tailTip: { x: number; y: number };
};

/** Narrator caption (left) + tall narrow framed figure (right), comic book style. */
export type ComicNarrationMeta = {
  /** Third-person / caption text — not a speech balloon. */
  narration: string;
  figureSrc: string;
  /**
   * Optional: place the autofit caption inside this content-normalized rect (same coords as `boxNorm` on speech bubbles).
   * Omitted: caption uses the left column width and is vertically centered in the panel body.
   */
  narrationBoxNorm?: { x: number; y: number; w: number; h: number };
  /**
   * Optional: place the framed figure inside this content-normalized rect.
   * Omitted: figure uses the default right column (32% width, full height).
   */
  figureNorm?: { x: number; y: number; w: number; h: number };
  thinkBubble?: ComicNarrationThinkBubble;
};

type PanelImgEntry = {
  status: "loading" | "ready" | "error";
  image: HTMLImageElement | null;
  promise: Promise<void>;
};

const panelImgCache = new Map<string, PanelImgEntry>();

function ensurePanelImageEntry(src: string): PanelImgEntry {
  const cached = panelImgCache.get(src);
  if (cached) return cached;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  const entry: PanelImgEntry = {
    status: "loading",
    image: null,
    promise: Promise.resolve(),
  };
  entry.promise = new Promise<void>((resolve) => {
    img.onload = () => {
      entry.status = "ready";
      entry.image = img;
      resolve();
    };
    img.onerror = () => {
      entry.status = "error";
      entry.image = null;
      resolve();
    };
    img.src = src;
  });
  panelImgCache.set(src, entry);
  return entry;
}

export function preloadComicPanelImages(panel?: ComicPanelMeta | null): Promise<void> {
  if (!panel) return Promise.resolve();
  const urls = [panel.professorSrc, panel.studentSrc].filter(
    (u): u is string => typeof u === "string" && u.length > 0
  );
  return Promise.all(urls.map((src) => ensurePanelImageEntry(src).promise)).then(() => {});
}

export function preloadComicNarrationImages(meta?: ComicNarrationMeta | null): Promise<void> {
  if (!meta?.figureSrc) return Promise.resolve();
  return ensurePanelImageEntry(meta.figureSrc).promise;
}

function getPanelImage(src: string): HTMLImageElement | null {
  const e = ensurePanelImageEntry(src);
  return e.status === "ready" ? e.image : null;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * **Scalloped ellipse** — even, round lobes like classic print speech balloons
 * (no vertex jitter, no lumpy harmonics).
 */
function buildCloudArc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angleStart: number,
  angleEnd: number,
  steps: number,
  seed: number
): [number, number][] {
  const arc: [number, number][] = [];
  const n = 7;
  const lobe = 0.062;
  const soft = 0.018;
  const phase = seed * 0.0037;
  for (let i = 0; i <= steps; i++) {
    const u = i / Math.max(1, steps);
    const t = angleStart + (angleEnd - angleStart) * u;
    const bump =
      1 +
      lobe * Math.cos(n * t + phase) +
      soft * Math.cos((n - 3) * t - phase * 0.65);
    const ex = Math.cos(t) * rx * bump;
    const ey = Math.sin(t) * ry * bump;
    arc.push([cx + ex, cy + ey]);
  }
  return arc;
}

type ThoughtPuff = { x: number; y: number; r: number };

/** Place many small overlapping circles in concentric rings — classic comic thought-cloud. */
function layoutThoughtPuffs(
  cx: number,
  cy: number,
  rx: number,
  ry: number
): ThoughtPuff[] {
  const puffs: ThoughtPuff[] = [];
  const outerN = 18;
  const outerAngles: number[] = [];
  const outerRadii: number[] = [];
  const outerPlace: number[] = [];
  for (let i = 0; i < outerN; i++) {
    const base = (i / outerN) * Math.PI * 2 + 0.17;
    const jit = ((Math.sin(i * 7.13 + 2.7) * 0.5 + 0.5) - 0.5) * 0.06;
    outerAngles.push(base + jit);
    outerRadii.push(0.14 + ((Math.sin(i * 3.91 + 1.2) * 0.5 + 0.5)) * 0.02);
    outerPlace.push(0.68 + ((Math.sin(i * 5.37 + 0.8) * 0.5 + 0.5)) * 0.03);
  }
  for (let i = 0; i < outerAngles.length; i++) {
    const a = outerAngles[i]!;
    puffs.push({
      x: cx + Math.cos(a) * rx * outerPlace[i]!,
      y: cy + Math.sin(a) * ry * outerPlace[i]!,
      r: Math.max(rx, ry) * outerRadii[i]!,
    });
  }
  const innerRings: { n: number; placeFrac: number; rFrac: number; offset: number }[] = [
    { n: 14, placeFrac: 0.42, rFrac: 0.24, offset: 0.3 },
    { n: 8,  placeFrac: 0.18, rFrac: 0.22, offset: 0.8 },
  ];
  for (const ring of innerRings) {
    for (let i = 0; i < ring.n; i++) {
      const a = (i / ring.n) * Math.PI * 2 + ring.offset;
      puffs.push({
        x: cx + Math.cos(a) * rx * ring.placeFrac,
        y: cy + Math.sin(a) * ry * ring.placeFrac,
        r: Math.max(rx, ry) * ring.rFrac,
      });
    }
  }
  puffs.push({ x: cx, y: cy, r: Math.max(rx, ry) * 0.3 });
  return puffs;
}

/**
 * Draw a cloud shape from overlapping circles:
 * 1. Stroke all circles (ink outline)
 * 2. Fill all circles (covers internal strokes, leaving only the outer edge)
 */
function drawPuffCloud(
  ctx: CanvasRenderingContext2D,
  puffs: ThoughtPuff[],
  fill: string | CanvasGradient,
  ink: string,
  lw: number
): void {
  for (const p of puffs) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.strokeStyle = ink;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  for (const p of puffs) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

/** Lay out a mini-cloud (3–4 puffs) for a trail element. */
function layoutMiniCloud(mx: number, my: number, size: number): ThoughtPuff[] {
  const n = 4;
  const placeR = size * 0.38;
  const pr = size * 0.52;
  const puffs: ThoughtPuff[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI * 0.4;
    puffs.push({
      x: mx + Math.cos(a) * placeR,
      y: my + Math.sin(a) * placeR,
      r: pr * (0.9 + 0.15 * Math.cos(a)),
    });
  }
  return puffs;
}

/**
 * Classic tail: **wide** at the cloud mouth, tapers to a **sharp** tip.
 * Wave bulges **away from the bubble body** (auto from mouth vs. cloud center).
 */
function traceClassicWaveTail(
  ctx: CanvasRenderingContext2D,
  arc: [number, number][],
  tip: [number, number],
  scale: number,
  bodyCx: number,
  bodyCy: number
): void {
  if (arc.length < 2) return;
  const a0 = arc[0]!;
  const a1 = arc[arc.length - 1]!;
  const mx = (a0[0] + a1[0]) * 0.5;
  const my = (a0[1] + a1[1]) * 0.5;
  const ta = Math.atan2(tip[1] - my, tip[0] - mx);
  let nx = -Math.sin(ta);
  let ny = Math.cos(ta);
  const vx = bodyCx - mx;
  const vy = bodyCy - my;
  if (nx * vx + ny * vy > 0) {
    nx = -nx;
    ny = -ny;
  }
  const wave = scale * 0.042;

  const c1x = (a1[0] + tip[0]) * 0.5 + nx * wave;
  const c1y = (a1[1] + tip[1]) * 0.5 + ny * wave;
  const c2x = (tip[0] + a0[0]) * 0.5 + nx * wave;
  const c2y = (tip[1] + a0[1]) * 0.5 + ny * wave;

  ctx.beginPath();
  ctx.moveTo(a0[0], a0[1]);
  for (let i = 1; i < arc.length; i++) ctx.lineTo(arc[i]![0], arc[i]![1]);

  ctx.quadraticCurveTo(c1x, c1y, tip[0], tip[1]);
  ctx.quadraticCurveTo(c2x, c2y, a0[0], a0[1]);
  ctx.closePath();
}

type BubbleBodyGeom = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  tip: [number, number];
};

/** Cloud speech bubble; `tipPx` is content-absolute pixels; returns body + tip for text. */
function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  ink: string,
  seed: number,
  tipPx: [number, number],
  R: typeof retroComicRoot
): BubbleBodyGeom {
  const cx = bx + bw * 0.5;
  const cy = by + bh * 0.43;
  const rx = bw * 0.41;
  const ry = bh * 0.385;
  const lw = Math.max(1.35, bw * 0.008);
  const steps = 72;

  const tip: [number, number] = [tipPx[0], tipPx[1]];

  const ang = Math.atan2(tip[1] - cy, tip[0] - cx);
  /** Wide mouth where the tail leaves the balloon (~44° wedge). */
  const gap = 0.39;
  const arc = buildCloudArc(
    cx,
    cy,
    rx,
    ry,
    ang + gap,
    ang - gap + Math.PI * 2,
    steps,
    seed
  );

  const scale = Math.min(bw, bh);
  const paint = (): void => {
    traceClassicWaveTail(ctx, arc, tip, scale, cx, cy);
  };

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  paint();
  const glowR = Math.max(rx, ry) * 1.12;
  const grd = ctx.createRadialGradient(cx, cy, glowR * 0.06, cx, cy, glowR);
  grd.addColorStop(0, "#fffefb");
  grd.addColorStop(0.38, R.halo);
  grd.addColorStop(1, R.haloWarm);
  ctx.fillStyle = grd;
  ctx.fill();

  ctx.strokeStyle = R.halo;
  ctx.lineWidth = lw * 1.3;
  paint();
  ctx.stroke();

  ctx.strokeStyle = R.paperEdge;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = lw * 0.5;
  paint();
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  paint();
  ctx.stroke();

  ctx.restore();

  return { cx, cy, rx, ry, tip };
}

/** Text in the **round body** (ellipse), nudged away from the tail toward `tip`. */
function drawBubbleText(
  ctx: CanvasRenderingContext2D,
  text: string,
  geom: BubbleBodyGeom,
  ink: string,
  fontPx: number,
  R: typeof retroComicRoot
): void {
  const { cx, cy, rx, ry, tip } = geom;
  const ta = Math.atan2(tip[1] - cy, tip[0] - cx);
  const shift = Math.min(rx, ry) * 0.11;
  const tcx = cx - Math.cos(ta) * shift;
  const tcy = cy - Math.sin(ta) * shift;

  ctx.save();
  ctx.font = `700 ${fontPx}px ${retroComicCoverBodyFontStack}`;
  ctx.letterSpacing = `${Math.max(0.35, fontPx * 0.024)}px`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const textRx = rx * 0.76;
  const textRy = ry * 0.7;
  const maxW = textRx * 1.65;
  const lines = wrapLines(ctx, text.toUpperCase(), maxW);
  const lh = fontPx * 1.16;
  const outlineW = Math.max(2, fontPx * 0.062);
  const totalH = lines.length * lh;
  let ty = tcy - totalH * 0.48 - fontPx * 0.06;

  ctx.beginPath();
  if (typeof ctx.ellipse === "function") {
    ctx.ellipse(tcx, tcy, textRx, textRy, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(tcx - textRx, tcy - textRy, textRx * 2, textRy * 2);
  }
  ctx.clip();

  ctx.lineJoin = "round";
  for (const ln of lines) {
    ctx.lineWidth = outlineW;
    ctx.strokeStyle = R.halo;
    ctx.strokeText(ln, tcx, ty);
    ctx.fillStyle = ink;
    ctx.fillText(ln, tcx, ty);
    ty += lh;
  }
  ctx.restore();
}

function bubbleBoxFromNorm(
  innerLeft: number,
  contentTop: number,
  innerW: number,
  contentH: number,
  box: ComicSpeechBubble["boxNorm"]
): { x: number; y: number; w: number; h: number } {
  return {
    x: innerLeft + box.x * innerW,
    y: contentTop + box.y * contentH,
    w: box.w * innerW,
    h: box.h * contentH,
  };
}

type FramedPortraitOpts = {
  /** Horizontal nudge as fraction of inner mat width (professor ~0.11 to the right). */
  imgNudgeXRatio: number;
  emptyLine1: string;
  emptyLine2?: string;
};

/** White mat + ink frame; figure bottom-aligned inside mat. */
function drawFramedPortrait(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  fx: number,
  fy: number,
  fw: number,
  fh: number,
  ink: string,
  R: typeof retroComicRoot,
  opts: FramedPortraitOpts
): void {
  const frameR = Math.min(16, fw * 0.022);
  const outerStroke = Math.max(2.5, Math.min(fw, fh) * 0.006);
  const inset = Math.max(11, Math.min(fw, fh) * 0.024);
  const innerX = fx + inset;
  const innerY = fy + inset;
  const innerW = fw - inset * 2;
  const innerH = fh - inset * 2;
  const imgNudgeX = Math.round(innerW * opts.imgNudgeXRatio);

  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(fx, fy, fw, fh, frameR);
  } else {
    ctx.rect(fx, fy, fw, fh);
  }
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = outerStroke;
  ctx.stroke();

  if (!img) {
    ctx.fillStyle = R.inkMuted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (opts.emptyLine2) {
      ctx.font = `700 ${Math.max(14, Math.round(fh * 0.065))}px ${retroComicCoverBodyFontStack}`;
      ctx.fillText(opts.emptyLine1, fx + fw / 2, fy + fh * 0.44);
      ctx.font = `400 ${Math.max(11, Math.round(fh * 0.048))}px ${retroComicCoverBodyFontStack}`;
      ctx.fillText(opts.emptyLine2, fx + fw / 2, fy + fh * 0.58);
    } else {
      ctx.font = `600 ${Math.round(fh * 0.055)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillText(opts.emptyLine1, fx + fw / 2, fy + fh * 0.5);
    }
    ctx.restore();
    return;
  }

  const innerR = Math.min(9, frameR * 0.55);
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(innerX, innerY, innerW, innerH, innerR);
  } else {
    ctx.rect(innerX, innerY, innerW, innerH);
  }
  ctx.clip();

  const scale = Math.min(innerW / img.width, innerH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = innerX + (innerW - dw) / 2 + imgNudgeX;
  const dy = innerY + innerH - dh;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

export function drawComicPanelLayout(
  ctx: CanvasRenderingContext2D,
  scene: SlideScene2d,
  w: number,
  h: number,
  tokens2d: CanvasTokens2d,
  paper: string,
  ink: string,
  titleStyle: CanvasBlockStyle | undefined
): void {
  const panel = scene.comicPanel!;
  const t = tokens2d;
  const pad = Math.round(Math.min(w, h) * t.padRatio);
  const R = retroComicRoot;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textBaseline = "top";

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);

  const borderW = Math.max(6, Math.round(Math.min(w, h) * 0.012));
  ctx.strokeStyle = ink;
  ctx.lineWidth = borderW;
  ctx.strokeRect(borderW * 0.5, borderW * 0.5, w - borderW, h - borderW);

  const innerLeft = borderW + pad * 0.45;
  const innerRight = w - borderW - pad * 0.45;
  const innerTop = borderW + pad * 0.35;
  const innerW = innerRight - innerLeft;
  const innerBottom = h - borderW - pad * 0.55;
  const innerPanelH = Math.max(80, innerBottom - innerTop - 2);

  /** Inner panel rule */
  ctx.strokeStyle = R.processYellow;
  ctx.lineWidth = Math.max(2, borderW * 0.22);
  ctx.setLineDash([6, 5]);
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(innerLeft + 2, innerTop + 2, innerW - 4, innerPanelH - 4, 8);
    ctx.stroke();
  } else {
    ctx.strokeRect(innerLeft + 2, innerTop + 2, innerW - 4, innerPanelH - 4);
  }
  ctx.setLineDash([]);

  const titlePx = Math.max(38, Math.round(Math.min(w, h) * 0.09));
  ctx.textAlign = "center";
  ctx.font = t.titleFont(titlePx);
  drawStyledTextLine(
    ctx,
    (scene.title ?? "").toUpperCase(),
    w / 2,
    innerTop + pad * 0.15,
    ink,
    1,
    titleStyle ? { ...titleStyle, align: "center" } : { align: "center" }
  );

  const contentTop = innerTop + titlePx * 1.12 + pad * 0.35;
  const contentBottom = innerTop + innerPanelH - pad * 0.3;
  const contentH = Math.max(120, contentBottom - contentTop);

  /** Student: large framed portrait bottom-left; professor: smaller frame right */
  const stSlotH = Math.min(contentH * 0.92, h * 0.64);
  const stSlotW = innerW * 0.42;
  const profSlotW = innerW * 0.4;
  const profSlotH = Math.min(contentH * 0.66, h * 0.42);
  const profSlotX = innerLeft + innerW * 0.54;
  const profSlotY = contentTop;

  const stSlotX = innerLeft;
  const stSlotY = contentBottom - stSlotH - pad * 0.02;

  /** Figures first, then bubbles + text on top */
  const profImg = getPanelImage(panel.professorSrc);
  drawFramedPortrait(ctx, profImg, profSlotX, profSlotY, profSlotW, profSlotH, ink, R, {
    imgNudgeXRatio: 0.11,
    emptyLine1: "Loading…",
  });

  const stImg = panel.studentSrc ? getPanelImage(panel.studentSrc) : null;
  drawFramedPortrait(ctx, stImg, stSlotX, stSlotY, stSlotW, stSlotH, ink, R, {
    imgNudgeXRatio: -0.08,
    emptyLine1: "FIGURE HERE",
    emptyLine2: "(add student.png)",
  });

  const bubbleFont = Math.max(12, Math.round(Math.min(w, h) * 0.021));
  for (let i = 0; i < panel.bubbles.length; i++) {
    const b = panel.bubbles[i]!;
    const box = bubbleBoxFromNorm(innerLeft, contentTop, innerW, contentH, b.boxNorm);
    const seed = 7103 + i * 13613;
    const tipPx: [number, number] = [
      innerLeft + b.tailTip.x * innerW,
      contentTop + b.tailTip.y * contentH,
    ];
    const geom = drawSpeechBubble(ctx, box.x, box.y, box.w, box.h, ink, seed, tipPx, R);
    drawBubbleText(ctx, b.text, geom, ink, bubbleFont, R);
  }

  ctx.restore();
}

type NarrationCaptionPlace =
  | { kind: "column"; x: number; contentTop: number; contentH: number; maxBw: number }
  | { kind: "region"; region: { x: number; y: number; w: number; h: number } };

/** Narration panel sized to wrapped text (up to column or region width). */
function drawNarrationCaptionBoxAutofit(
  ctx: CanvasRenderingContext2D,
  text: string,
  ink: string,
  R: typeof retroComicRoot,
  fontPx: number,
  place: NarrationCaptionPlace
): void {
  const padX = fontPx * 0.92;
  const padY = fontPx * 0.88;
  const maxBw = place.kind === "column" ? place.maxBw : place.region.w;
  const wrapLimit = Math.max(64, maxBw - padX * 2);

  ctx.save();
  ctx.font = `italic 500 ${fontPx}px ${retroComicCoverBodyFontStack}`;
  ctx.letterSpacing = `${Math.max(0.2, fontPx * 0.016)}px`;
  const lines = wrapLines(ctx, text.trim(), wrapLimit);
  let maxLine = 0;
  for (const ln of lines) maxLine = Math.max(maxLine, ctx.measureText(ln).width);
  const bw = Math.ceil(Math.min(maxBw, maxLine + padX * 2 + 4));
  const lh = fontPx * 1.34;
  const bh = Math.ceil(lines.length * lh + padY * 2);
  let x: number;
  let y: number;
  if (place.kind === "column") {
    x = place.x;
    y = place.contentTop + Math.max(0, (place.contentH - bh) * 0.5);
  } else {
    const r = place.region;
    x = r.x + Math.max(0, (r.w - bw) * 0.5);
    y = r.y + Math.max(0, (r.h - bh) * 0.5);
  }

  const r = Math.min(10, bw * 0.018);
  const outerLw = Math.max(2.5, Math.min(bw, bh) * 0.006);
  const inset = Math.max(4, outerLw * 1.15);

  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, bw, bh, r);
  } else {
    ctx.rect(x, y, bw, bh);
  }
  ctx.fillStyle = R.halo;
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = outerLw;
  ctx.stroke();

  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x + inset, y + inset, bw - inset * 2, bh - inset * 2, r * 0.55);
  } else {
    ctx.rect(x + inset, y + inset, bw - inset * 2, bh - inset * 2);
  }
  ctx.strokeStyle = R.processYellow;
  ctx.lineWidth = Math.max(1.2, outerLw * 0.4);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let ty = y + padY;
  for (const ln of lines) {
    ctx.fillText(ln, x + padX, ty);
    ty += lh;
  }
  ctx.restore();
}

function drawThoughtInteriorText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  ink: string,
  fontPx: number,
  R: typeof retroComicRoot
): void {
  ctx.save();
  ctx.font = `italic 600 ${fontPx}px ${retroComicCoverBodyFontStack}`;
  ctx.letterSpacing = `${Math.max(0.25, fontPx * 0.02)}px`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const textRx = rx * 0.62;
  const textRy = ry * 0.56;
  const maxW = textRx * 1.52;
  const lines = wrapLines(ctx, text.trim(), maxW);
  const lh = fontPx * 1.12;
  const totalH = lines.length * lh;
  let ty = cy - totalH * 0.48 - fontPx * 0.05;

  ctx.beginPath();
  if (typeof ctx.ellipse === "function") {
    ctx.ellipse(cx, cy, textRx, textRy, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(cx - textRx, cy - textRy, textRx * 2, textRy * 2);
  }
  ctx.clip();

  ctx.lineJoin = "round";
  const outlineW = Math.max(1.6, fontPx * 0.05);
  for (const ln of lines) {
    ctx.lineWidth = outlineW;
    ctx.strokeStyle = R.halo;
    ctx.strokeText(ln, cx, ty);
    ctx.fillStyle = ink;
    ctx.fillText(ln, cx, ty);
    ty += lh;
  }
  ctx.restore();
}

/**
 * Classic comic thought bubble: overlapping circles (visible round bumps with concave
 * pinches between them) + italic text + trail of shrinking mini-clouds toward the
 * character's head.
 */
function drawThoughtBubble(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  thoughtText: string,
  tipPx: [number, number],
  ink: string,
  _seed: number,
  R: typeof retroComicRoot,
  fontPx: number
): void {
  const cx = bx + bw * 0.5;
  const cy = by + bh * 0.46;
  const rx = bw * 0.48;
  const ry = bh * 0.44;
  const lw = Math.max(1.8, Math.min(bw, bh) * 0.012);

  const puffs = layoutThoughtPuffs(cx, cy, rx, ry);

  let glowR = 0;
  for (const p of puffs) {
    const d = Math.hypot(p.x - cx, p.y - cy) + p.r;
    if (d > glowR) glowR = d;
  }
  const grd = ctx.createRadialGradient(cx, cy, glowR * 0.04, cx, cy, glowR * 1.02);
  grd.addColorStop(0, "#fffefb");
  grd.addColorStop(0.4, R.halo);
  grd.addColorStop(1, R.haloWarm);

  ctx.save();
  drawPuffCloud(ctx, puffs, grd, ink, lw);
  drawThoughtInteriorText(ctx, thoughtText, cx, cy, rx, ry, ink, fontPx, R);

  // Nearest puff edge toward the tail tip — attach trail there
  const tdx = tipPx[0] - cx;
  const tdy = tipPx[1] - cy;
  let attachX = cx;
  let attachY = cy;
  let bestProj = -1e9;
  for (const p of puffs) {
    const px = p.x + (tdx / (Math.hypot(tdx, tdy) || 1)) * p.r;
    const py = p.y + (tdy / (Math.hypot(tdx, tdy) || 1)) * p.r;
    const proj = (px - cx) * tdx + (py - cy) * tdy;
    if (proj > bestProj) {
      bestProj = proj;
      attachX = px;
      attachY = py;
    }
  }

  // Trail: 3 mini-clouds, large near the main cloud, small near the head
  const trailCount = 3;
  const sizes = [
    Math.min(bw, bh) * 0.11,
    Math.min(bw, bh) * 0.065,
    Math.min(bw, bh) * 0.038,
  ];
  for (let i = 0; i < trailCount; i++) {
    const t = (i + 1) / (trailCount + 1);
    const mx = attachX + (tipPx[0] - attachX) * t;
    const my = attachY + (tipPx[1] - attachY) * t;
    const miniPuffs = layoutMiniCloud(mx, my, sizes[i]!);
    drawPuffCloud(ctx, miniPuffs, R.halo, ink, Math.max(1.1, lw * 0.7));
  }

  ctx.restore();
}

/** Left narration panel + right tall framed illustration (same chrome as `drawComicPanelLayout`). */
export function drawComicNarrationLayout(
  ctx: CanvasRenderingContext2D,
  scene: SlideScene2d,
  w: number,
  h: number,
  tokens2d: CanvasTokens2d,
  paper: string,
  ink: string,
  titleStyle: CanvasBlockStyle | undefined
): void {
  const meta = scene.comicNarration!;
  const t = tokens2d;
  const pad = Math.round(Math.min(w, h) * t.padRatio);
  const R = retroComicRoot;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textBaseline = "top";

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);

  const borderW = Math.max(6, Math.round(Math.min(w, h) * 0.012));
  ctx.strokeStyle = ink;
  ctx.lineWidth = borderW;
  ctx.strokeRect(borderW * 0.5, borderW * 0.5, w - borderW, h - borderW);

  const innerLeft = borderW + pad * 0.45;
  const innerRight = w - borderW - pad * 0.45;
  const innerTop = borderW + pad * 0.35;
  const innerW = innerRight - innerLeft;
  const innerBottom = h - borderW - pad * 0.55;
  const innerPanelH = Math.max(80, innerBottom - innerTop - 2);

  ctx.strokeStyle = R.processYellow;
  ctx.lineWidth = Math.max(2, borderW * 0.22);
  ctx.setLineDash([6, 5]);
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(innerLeft + 2, innerTop + 2, innerW - 4, innerPanelH - 4, 8);
    ctx.stroke();
  } else {
    ctx.strokeRect(innerLeft + 2, innerTop + 2, innerW - 4, innerPanelH - 4);
  }
  ctx.setLineDash([]);

  const titlePx = Math.max(38, Math.round(Math.min(w, h) * 0.09));
  ctx.textAlign = "center";
  ctx.font = t.titleFont(titlePx);
  drawStyledTextLine(
    ctx,
    (scene.title ?? "").toUpperCase(),
    w / 2,
    innerTop + pad * 0.15,
    ink,
    1,
    titleStyle ? { ...titleStyle, align: "center" } : { align: "center" }
  );

  const contentTop = innerTop + titlePx * 1.12 + pad * 0.35;
  const contentBottom = innerTop + innerPanelH - pad * 0.28;
  const contentH = Math.max(100, contentBottom - contentTop);

  const capFont = Math.max(14, Math.round(Math.min(w, h) * 0.024));
  const bubbleFont = Math.max(12, Math.round(Math.min(w, h) * 0.021));

  let figX: number, figY: number, figW: number, figH: number;
  if (meta.figureNorm) {
    const fb = bubbleBoxFromNorm(innerLeft, contentTop, innerW, contentH, meta.figureNorm);
    figX = fb.x; figY = fb.y; figW = fb.w; figH = fb.h;
  } else {
    figW = innerW * 0.32;
    const gap = innerW * 0.045;
    const narrW = innerW - figW - gap;
    figH = contentH * 0.97;
    figX = innerLeft + narrW + gap;
    figY = contentTop + (contentH - figH) * 0.5;
  }

  const figImg = getPanelImage(meta.figureSrc);
  drawFramedPortrait(ctx, figImg, figX, figY, figW, figH, ink, R, {
    imgNudgeXRatio: 0,
    emptyLine1: "Loading…",
  });

  const defaultNarrW = meta.figureNorm
    ? innerW * 0.6
    : innerW - innerW * 0.32 - innerW * 0.045;

  const narrPlace: NarrationCaptionPlace =
    meta.narrationBoxNorm != null
      ? {
          kind: "region",
          region: bubbleBoxFromNorm(
            innerLeft,
            contentTop,
            innerW,
            contentH,
            meta.narrationBoxNorm
          ),
        }
      : {
          kind: "column",
          x: innerLeft,
          contentTop,
          contentH,
          maxBw: defaultNarrW,
        };

  drawNarrationCaptionBoxAutofit(ctx, meta.narration, ink, R, capFont, narrPlace);

  const think = meta.thinkBubble;
  if (think) {
    const box = bubbleBoxFromNorm(innerLeft, contentTop, innerW, contentH, think.boxNorm);
    const tipPx: [number, number] = [
      innerLeft + think.tailTip.x * innerW,
      contentTop + think.tailTip.y * contentH,
    ];
    drawThoughtBubble(ctx, box.x, box.y, box.w, box.h, think.text, tipPx, ink, 6021, R, bubbleFont);
  }

  ctx.restore();
}

/* ─── Data-table layout ─── */

export type ComicTableSpec = {
  /** Optional label rendered above the table (e.g. a filename). */
  label?: string;
  columns: string[];
  rows: (string | null)[][];
};

/** Single table or array of tables rendered side by side. */
export type ComicTableMeta = ComicTableSpec | ComicTableSpec[];

function drawSingleTable(
  ctx: CanvasRenderingContext2D,
  spec: ComicTableSpec,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
  ink: string,
  w: number,
  h: number,
  R: typeof retroComicRoot
): void {
  const { columns, rows } = spec;
  const nCols = columns.length;
  const nRows = rows.length;

  const headerFont = Math.max(11, Math.round(Math.min(w, h) * 0.018));
  const cellFont = Math.max(10, Math.round(Math.min(w, h) * 0.016));
  const rowH = Math.max(cellFont * 1.8, Math.min(areaH / (nRows + 2), cellFont * 2.8));
  const tableH = rowH * (nRows + 1);
  const tableMaxW = areaW * 0.96;
  const tableW = Math.min(tableMaxW, nCols * Math.max(70, tableMaxW / nCols));
  const labelFont = Math.max(12, Math.round(Math.min(w, h) * 0.02));
  const labelH = spec.label ? labelFont * 1.8 : 0;
  const tableX = areaX + (areaW - tableW) * 0.5;
  const tableY = areaY + (areaH - tableH - labelH) * 0.5 + labelH;
  const colW = tableW / nCols;

  if (spec.label) {
    ctx.font = `600 ${labelFont}px ${retroComicCoverBodyFontStack}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = ink;
    ctx.fillText(spec.label, tableX + tableW * 0.5, tableY - labelH + labelFont * 0.3);
  }

  const gridLw = Math.max(1, Math.min(w, h) * 0.002);

  ctx.fillStyle = R.processYellow;
  ctx.fillRect(tableX, tableY, tableW, rowH);

  for (let r = 0; r < nRows; r++) {
    if (r % 2 === 1) {
      ctx.fillStyle = R.paperMuted;
      ctx.fillRect(tableX, tableY + (r + 1) * rowH, tableW, rowH);
    }
  }

  ctx.strokeStyle = ink;
  ctx.lineWidth = gridLw;
  ctx.beginPath();
  for (let r = 0; r <= nRows + 1; r++) {
    const ly = tableY + r * rowH;
    ctx.moveTo(tableX, ly);
    ctx.lineTo(tableX + tableW, ly);
  }
  for (let c = 0; c <= nCols; c++) {
    const lx = tableX + c * colW;
    ctx.moveTo(lx, tableY);
    ctx.lineTo(lx, tableY + (nRows + 1) * rowH);
  }
  ctx.stroke();

  ctx.lineWidth = gridLw * 2.5;
  ctx.beginPath();
  ctx.moveTo(tableX, tableY + rowH);
  ctx.lineTo(tableX + tableW, tableY + rowH);
  ctx.stroke();

  ctx.lineWidth = gridLw * 2;
  ctx.strokeRect(tableX, tableY, tableW, (nRows + 1) * rowH);

  for (let c = 0; c < nCols; c++) {
    const cx = tableX + c * colW + colW * 0.5;
    const cy = tableY + rowH * 0.5 - headerFont * 0.4;
    ctx.font = `700 ${headerFont}px ${retroComicCoverBodyFontStack}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = ink;
    ctx.fillText(columns[c]!, cx, cy);
  }

  for (let r = 0; r < nRows; r++) {
    const row = rows[r]!;
    for (let c = 0; c < nCols; c++) {
      const val = c < row.length ? row[c] : null;
      if (val != null) {
        const cx = tableX + c * colW + colW * 0.5;
        const cy = tableY + (r + 1) * rowH + rowH * 0.5 - cellFont * 0.4;
        ctx.font = `400 ${cellFont}px ${retroComicCoverBodyFontStack}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = ink;
        ctx.fillText(val, cx, cy);
      }
    }
  }
}

export function drawComicTableLayout(
  ctx: CanvasRenderingContext2D,
  scene: SlideScene2d,
  w: number,
  h: number,
  tokens2d: CanvasTokens2d,
  paper: string,
  ink: string,
  titleStyle: CanvasBlockStyle | undefined
): void {
  const raw = scene.comicTable!;
  const tables: ComicTableSpec[] = Array.isArray(raw) ? raw : [raw];
  const t = tokens2d;
  const pad = Math.round(Math.min(w, h) * t.padRatio);
  const R = retroComicRoot;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textBaseline = "top";

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);

  const borderW = Math.max(6, Math.round(Math.min(w, h) * 0.012));
  ctx.strokeStyle = ink;
  ctx.lineWidth = borderW;
  ctx.strokeRect(borderW * 0.5, borderW * 0.5, w - borderW, h - borderW);

  const innerLeft = borderW + pad * 0.45;
  const innerRight = w - borderW - pad * 0.45;
  const innerTop = borderW + pad * 0.35;
  const innerW = innerRight - innerLeft;
  const innerBottom = h - borderW - pad * 0.55;
  const innerPanelH = Math.max(80, innerBottom - innerTop - 2);

  ctx.strokeStyle = R.processYellow;
  ctx.lineWidth = Math.max(2, borderW * 0.22);
  ctx.setLineDash([6, 5]);
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(innerLeft + 2, innerTop + 2, innerW - 4, innerPanelH - 4, 8);
    ctx.stroke();
  } else {
    ctx.strokeRect(innerLeft + 2, innerTop + 2, innerW - 4, innerPanelH - 4);
  }
  ctx.setLineDash([]);

  const titlePx = Math.max(38, Math.round(Math.min(w, h) * 0.09));
  ctx.textAlign = "center";
  ctx.font = t.titleFont(titlePx);
  drawStyledTextLine(
    ctx,
    (scene.title ?? "").toUpperCase(),
    w / 2,
    innerTop + pad * 0.15,
    ink,
    1,
    titleStyle ? { ...titleStyle, align: "center" } : { align: "center" }
  );

  const contentTop = innerTop + titlePx * 1.12 + pad * 0.35;
  const contentBottom = innerTop + innerPanelH - pad * 0.28;
  const contentH = Math.max(100, contentBottom - contentTop);

  const gap = Math.round(innerW * 0.03);
  const slotW = (innerW - gap * (tables.length - 1)) / tables.length;

  for (let i = 0; i < tables.length; i++) {
    const slotX = innerLeft + i * (slotW + gap);
    drawSingleTable(ctx, tables[i]!, slotX, contentTop, slotW, contentH, ink, w, h, R);
  }

  ctx.restore();
}

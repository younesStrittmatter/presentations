import type { CanvasBlockStyle } from "../styles/types";
import type { CanvasTokens2d } from "../styles/types";
import type { SlideScene2d } from "../slideScene2d";
import { drawStyledTextLine } from "../shared/textStyle";
import { retroComicCoverBodyFontStack, retroComicRoot } from "./theme";

/** Golden Age-style cover chrome (issue, price, credits). */
export type ComicCoverMeta = {
  issue: string;
  price: string;
  byline: string;
  date?: string;
  tagline?: string;
  heroSrc?: string;
};

type CoverHeroEntry = {
  status: "loading" | "ready" | "error";
  image: HTMLImageElement | null;
  promise: Promise<void>;
};

const coverHeroCache = new Map<string, CoverHeroEntry>();

function ensureCoverHeroEntry(src: string): CoverHeroEntry {
  const cached = coverHeroCache.get(src);
  if (cached) return cached;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  const entry: CoverHeroEntry = {
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
  coverHeroCache.set(src, entry);
  return entry;
}

/** Preload hero art using the same cache that renderer reads from. */
export function preloadCoverHeroImage(src?: string | null): Promise<void> {
  if (!src) return Promise.resolve();
  return ensureCoverHeroEntry(src).promise;
}

function getCoverHeroImage(src: string): HTMLImageElement | null {
  if (!src) return null;
  const entry = ensureCoverHeroEntry(src);
  return entry.status === "ready" ? entry.image : null;
}

function drawSunburst(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  rayCount: number,
  yellow: string,
  red: string
): void {
  ctx.save();
  ctx.translate(cx, cy);
  const step = (Math.PI * 2) / rayCount;
  for (let i = 0; i < rayCount; i++) {
    const a0 = i * step - step * 0.35;
    const a1 = i * step + step * 0.35;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, outerR, a0, a1);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? yellow : red;
    ctx.globalAlpha = 0.14;
    ctx.fill();
  }
  ctx.restore();
}

export function drawComicCoverLayout(
  ctx: CanvasRenderingContext2D,
  scene: SlideScene2d,
  w: number,
  h: number,
  tokens2d: CanvasTokens2d,
  paper: string,
  ink: string,
  titleStyle: CanvasBlockStyle | undefined
): void {
  const cover = scene.comicCover!;
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

  const grd = ctx.createRadialGradient(
    w * 0.85,
    h * 0.15,
    0,
    w * 0.85,
    h * 0.15,
    Math.max(w, h) * 0.7
  );
  grd.addColorStop(0, "rgba(0,0,0,0.06)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  const borderW = Math.max(6, Math.round(Math.min(w, h) * 0.012));
  const mastH = scene.subtitle ? Math.round(h * 0.07) : 0;
  const coverTitlePx = Math.max(120, Math.round(Math.min(w, h) * 0.31));
  const titleY = borderW + pad * 0.35 + mastH + h * 0.05;
  const sunCx = w * 0.5;
  const sunCy = titleY + coverTitlePx * 0.14;
  /** Full-bleed rays to farthest canvas corner from burst center */
  const sunOuterR =
    Math.hypot(Math.max(sunCx, w - sunCx), Math.max(sunCy, h - sunCy)) * 1.02;
  drawSunburst(ctx, sunCx, sunCy, sunOuterR, 36, R.processYellow, R.processRed);

  ctx.strokeStyle = ink;
  ctx.lineWidth = borderW;
  ctx.strokeRect(borderW * 0.5, borderW * 0.5, w - borderW, h - borderW);

  const innerLeft = borderW + pad * 0.5;
  const innerRight = w - borderW - pad * 0.5;
  const innerTop = borderW + pad * 0.35;
  const innerW = innerRight - innerLeft;

  if (scene.subtitle) {
    ctx.fillStyle = ink;
    ctx.fillRect(innerLeft, innerTop, innerW, mastH);
    const mastFontPx = Math.max(14, Math.round(mastH * 0.38));
    ctx.font = `600 ${mastFontPx}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = R.processYellow;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(scene.subtitle.toUpperCase(), w / 2, innerTop + mastH / 2);
  }

  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  const issueW = Math.min(innerW * 0.22, 160);
  const issueH = Math.round(issueW * 0.9);
  const ix = innerRight - issueW - pad * 0.2;
  const iy = innerTop + mastH + pad * 0.35;
  ctx.save();
  ctx.translate(ix + issueW * 0.5, iy + issueH * 0.5);
  ctx.rotate(-0.11);
  ctx.fillStyle = R.processRed;
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(2, borderW * 0.35);
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(-issueW / 2, -issueH / 2, issueW, issueH, 6);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(-issueW / 2, -issueH / 2, issueW, issueH);
    ctx.strokeRect(-issueW / 2, -issueH / 2, issueW, issueH);
  }
  const issueNum = cover.issue.replace(/^#/, "");
  ctx.fillStyle = R.halo;
  ctx.textAlign = "center";
  ctx.font = `700 ${Math.round(issueW * 0.13)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText("ISSUE", 0, -issueH * 0.18);
  ctx.font = `800 ${Math.round(issueW * 0.36)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(`#${issueNum}`, 0, issueH * 0.02);
  ctx.restore();

  ctx.textAlign = "center";
  ctx.font = t.titleFont(coverTitlePx);
  drawStyledTextLine(
    ctx,
    scene.title ?? "",
    w / 2,
    titleY,
    ink,
    1,
    titleStyle ? { ...titleStyle, align: "center" } : { align: "center" }
  );

  let heroDrawn = false;
  if (cover.heroSrc) {
    const heroImg = getCoverHeroImage(cover.heroSrc);
    if (heroImg) {
      /** Hero bottom as low as allowed: frame vs footer band (same metrics as tag/credits below) */
      const footerYLine = h - borderW - Math.max(6, Math.round(pad * 0.12));
      const footerCredEst = Math.max(17, Math.round(Math.min(w, h) * 0.028));
      const footerTagEst = Math.max(18, Math.round(h * 0.038));
      const heroLiftPx = Math.round(Math.min(w, h) * 0.004);
      const safeBottom = Math.min(
        h - borderW - Math.round(pad * 0.22),
        footerYLine - Math.max(footerTagEst, footerCredEst) - 5 + heroLiftPx
      );
      const safeW = innerW;
      /** Top of hero pulled up: overlap with title + room to scale tall */
      const titleApproxBottom = titleY + coverTitlePx * 0.84;
      const overlapPx = Math.min(coverTitlePx * 0.42, Math.round(h * 0.066));
      const heroTopMin = titleApproxBottom - overlapPx;
      const maxHeroH = Math.max(24, safeBottom - heroTopMin);
      const scale = Math.min(safeW / heroImg.width, maxHeroH / heroImg.height);
      const dw = heroImg.width * scale;
      const dh = heroImg.height * scale;
      const dx = w / 2 - dw / 2;
      const dy = safeBottom - dh - heroLiftPx;
      ctx.drawImage(heroImg, dx, dy, dw, dh);
      heroDrawn = true;
    }
  }

  if (!heroDrawn) {
    const phW = innerW * 0.62;
    const phH = h * 0.48;
    const phX = w / 2 - phW / 2;
    const phY = titleY + coverTitlePx * 0.88;
    ctx.fillStyle = "rgba(21, 101, 192, 0.12)";
    ctx.strokeStyle = R.inkMuted;
    ctx.lineWidth = Math.max(2, borderW * 0.22);
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(phX, phY, phW, phH);
    ctx.setLineDash([]);
    ctx.font = `700 ${Math.max(12, Math.round(h * 0.02))}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = R.inkMuted;
    ctx.textAlign = "center";
    ctx.fillText("Hero art loading...", w / 2, phY + phH * 0.42);
  }

  const priceW = Math.min(innerW * 0.26, Math.max(112, Math.min(w, h) * 0.2));
  const priceH = Math.round(priceW * 1.2);
  const px0 = innerLeft + pad * 0.28;
  const py0 = innerTop + mastH + pad * 0.34;
  const isOpenPrice = /\bopen\b/i.test(cover.price);
  ctx.fillStyle = isOpenPrice ? "#66bb6a" : R.processYellow;
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(2, borderW * 0.3);
  ctx.save();
  ctx.translate(px0 + priceW * 0.5, py0 + priceH * 0.5);
  ctx.rotate(-0.05);
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(-priceW * 0.5, -priceH * 0.5, priceW, priceH, 8);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(-priceW * 0.5, -priceH * 0.5, priceW, priceH);
    ctx.strokeRect(-priceW * 0.5, -priceH * 0.5, priceW, priceH);
  }
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  if (isOpenPrice) {
    const topY = -priceH * 0.42;
    const openPx = Math.round(priceH * 0.2);
    const sourcePx = Math.round(priceH * 0.155);
    const datePx = Math.round(priceH * 0.15);
    const yearPx = Math.round(priceH * 0.14);

    ctx.font = `900 ${openPx}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText("OPEN", 0, topY);
    ctx.font = `700 ${sourcePx}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText("source", 0, topY + openPx * 0.98);

    const lineY = topY + openPx + sourcePx + priceH * 0.08;
    ctx.lineWidth = Math.max(1.8, borderW * 0.2);
    ctx.beginPath();
    ctx.moveTo(-priceW * 0.35, lineY);
    ctx.lineTo(priceW * 0.35, lineY);
    ctx.stroke();

    const rawDate = cover.date?.trim() || "27 Mar 2026";
    const match = rawDate.match(/^(\d{1,2}\s+[A-Za-z]{3,})(?:\s+(\d{4}))?$/);
    const dateLine = (match?.[1] ?? rawDate).toUpperCase();
    const yearLine = (match?.[2] ?? rawDate.split(/\s+/).slice(-1)[0] ?? "").toUpperCase();
    const dateY = lineY + priceH * 0.08;
    ctx.font = `800 ${datePx}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(dateLine, 0, dateY);
    ctx.font = `800 ${yearPx}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(yearLine, 0, dateY + datePx * 0.95);
  } else {
    const priceFont = Math.round(priceH * 0.32);
    ctx.font = `900 ${priceFont}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(cover.price, 0, 0);
  }
  ctx.restore();

  /** Tagline + credits hug the bottom inside the frame */
  const footerY = h - borderW - Math.max(6, Math.round(pad * 0.12));
  const tagPx = Math.max(18, Math.round(h * 0.038));
  const credPx = Math.max(17, Math.round(Math.min(w, h) * 0.028));

  if (cover.tagline) {
    ctx.font = `700 ${tagPx}px ${retroComicCoverBodyFontStack}`;
    ctx.fillStyle = R.processRed;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(cover.tagline.toUpperCase(), innerLeft + pad * 0.4, footerY);
  }

  ctx.font = `400 ${credPx}px ${retroComicCoverBodyFontStack}`;
  ctx.fillStyle = R.inkMuted;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(cover.byline.toUpperCase(), innerRight, footerY);

  ctx.restore();
}

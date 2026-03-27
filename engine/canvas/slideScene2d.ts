/**
 * Generic canvas slide renderer.
 * Retro comic cover-specific drawing lives in `engine/canvas/vintage-comic/cover.ts`.
 */
import { contentAnchorX, drawStyledTextLine } from "./shared/textStyle";
import { getCanvasStyle, type CanvasBlockRole, type CanvasBlockStyle, type CanvasStyleId } from "./styles";
import { drawComicCoverLayout, type ComicCoverMeta } from "./vintage-comic/cover";
import {
  drawComicBulletBoxLayout,
  drawComicNarrationLayout,
  drawComicPanelLayout,
  drawComicTableLayout,
  type ComicBulletBoxMeta,
  type ComicNarrationMeta,
  type ComicPanelMeta,
  type ComicTableMeta,
} from "./vintage-comic/panel";

export type { ComicCoverMeta } from "./vintage-comic/cover";
export type {
  ComicBulletBoxMeta,
  ComicNarrationMeta,
  ComicNarrationThinkBubble,
  ComicPanelMeta,
  ComicSpeechBubble,
  ComicTableMeta,
} from "./vintage-comic/panel";

export type SlideScene2d = {
  title?: string;
  subtitle?: string;
  bullets?: string[];
  note?: string;
  paper?: string;
  ink?: string;
  /** Preset id from `registerCanvasStyle` / built-ins: `default`, `retro-comic`, `noir`, `minimal`, … */
  canvasStyle?: CanvasStyleId | null;
  /** Per-slide overrides for block targets (`title`, `subtitle`, `bullet`, `note`) */
  blocks?: Partial<Record<CanvasBlockRole, CanvasBlockStyle>>;
  /** When set, draws a comic-book cover layout instead of the normal stack */
  comicCover?: ComicCoverMeta;
  /** When set, draws a two-figure comic panel with speech bubbles */
  comicPanel?: ComicPanelMeta;
  /** Narration caption + tall framed figure on the right */
  comicNarration?: ComicNarrationMeta;
  /** Data table centered in the panel */
  comicTable?: ComicTableMeta;
  /** Numbered bullet list in a centered narration box */
  comicBulletBox?: ComicBulletBoxMeta;
  /** When true, the slide is redrawn every frame (for animations). */
  animated?: boolean;
};

function mergeBlockStyle(
  role: CanvasBlockRole,
  scene: SlideScene2d,
  presetBlocks: Partial<Record<CanvasBlockRole, CanvasBlockStyle>> | undefined
): CanvasBlockStyle | undefined {
  const a = presetBlocks?.[role];
  const b = scene.blocks?.[role];
  if (!a && !b) return undefined;
  return { ...a, ...b };
}


export function drawSlideScene2d(
  ctx: CanvasRenderingContext2D,
  scene: SlideScene2d,
  w: number,
  h: number
): void {
  const style = getCanvasStyle(scene.canvasStyle);
  const t = style.tokens2d;
  const paper = scene.paper ?? style.defaultPaper;
  const ink = scene.ink ?? style.defaultInk;
  const presetBlocks = style.blocks;

  if (scene.comicCover) {
    drawComicCoverLayout(
      ctx,
      scene,
      w,
      h,
      t,
      paper,
      ink,
      mergeBlockStyle("title", scene, presetBlocks)
    );
    return;
  }
  if (scene.comicPanel) {
    drawComicPanelLayout(
      ctx,
      scene,
      w,
      h,
      t,
      paper,
      ink,
      mergeBlockStyle("title", scene, presetBlocks)
    );
    return;
  }
  if (scene.comicNarration) {
    drawComicNarrationLayout(
      ctx,
      scene,
      w,
      h,
      t,
      paper,
      ink,
      mergeBlockStyle("title", scene, presetBlocks)
    );
    return;
  }
  if (scene.comicTable) {
    drawComicTableLayout(
      ctx,
      scene,
      w,
      h,
      t,
      paper,
      ink,
      mergeBlockStyle("title", scene, presetBlocks)
    );
    return;
  }
  if (scene.comicBulletBox) {
    drawComicBulletBoxLayout(
      ctx,
      scene,
      w,
      h,
      t,
      paper,
      ink,
      mergeBlockStyle("title", scene, presetBlocks)
    );
    return;
  }
  const pad = Math.round(Math.min(w, h) * t.padRatio);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);

  ctx.textBaseline = "top";

  const titleSize = Math.max(t.titleMinPx, Math.round(w * t.titleSizeMul));
  let y = pad;

  {
    const bs = mergeBlockStyle("title", scene, presetBlocks);
    const align = bs?.align ?? "left";
    ctx.textAlign = align;
    const ax = contentAnchorX(pad, w, align);
    ctx.font = t.titleFont(titleSize);
    drawStyledTextLine(ctx, scene.title ?? "", ax, y, ink, 1, bs);
  }

  ctx.textAlign = "left";
  y += titleSize * t.titleLineMul;

  if (scene.subtitle) {
    const bs = mergeBlockStyle("subtitle", scene, presetBlocks);
    const align = bs?.align ?? "left";
    ctx.textAlign = align;
    const ax = contentAnchorX(pad, w, align);
    const subSize = Math.max(t.subtitleMinPx, Math.round(w * t.subtitleSizeMul));
    ctx.font = t.subtitleFont(subSize);
    drawStyledTextLine(
      ctx,
      scene.subtitle,
      ax,
      y,
      ink,
      t.subtitleOpacity,
      bs
    );
    ctx.textAlign = "left";
    y += subSize * t.subtitleLineMul;
  }

  if (scene.bullets?.length) {
    const bs = mergeBlockStyle("bullet", scene, presetBlocks);
    const align = bs?.align ?? "left";
    ctx.textAlign = align;
    const ax = contentAnchorX(pad, w, align);
    const bSize = Math.max(t.bulletMinPx, Math.round(w * t.bulletSizeMul));
    ctx.font = t.bulletFont(bSize);
    for (const line of scene.bullets) {
      drawStyledTextLine(ctx, "•  " + line, ax, y, ink, 1, bs);
      y += bSize * t.bulletLineMul;
    }
    ctx.textAlign = "left";
  }

  if (scene.note) {
    y += Math.round(titleSize * t.noteTopPadMul);
    const bs = mergeBlockStyle("note", scene, presetBlocks);
    const align = bs?.align ?? "left";
    ctx.textAlign = align;
    const ax = contentAnchorX(pad, w, align);
    const nSize = Math.max(t.noteMinPx, Math.round(w * t.noteSizeMul));
    ctx.font = t.noteFont(nSize);
    const note = String(scene.note).replace(/^_+|_+$/g, "");
    drawStyledTextLine(ctx, note, ax, y, ink, t.noteOpacity, bs);
  }
}

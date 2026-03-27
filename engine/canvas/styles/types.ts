/** Id passed from scenes as `canvasStyle: 'my-theme'` or layout override. */
export type CanvasStyleId = string;

/** Named slots the 2D layout can style independently (like CSS selectors). */
export type CanvasBlockRole = "title" | "subtitle" | "bullet" | "note";

/**
 * Visual treatment for one block; merge preset `CanvasStyleDefinition.blocks`
 * with optional per-slide `SlideScene2d.blocks` (slide wins on conflict).
 */
export type CanvasBlockStyle = {
  /** Fill color; defaults to slide `ink` */
  color?: string;
  /** Multiplied with flow opacity (e.g. subtitle token opacity × this) */
  opacity?: number;
  /** Text anchor within the content band `[pad, w - pad]` */
  align?: "left" | "center" | "right";
  offsetX?: number;
  offsetY?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  strokeColor?: string;
  /** Inner ink line around glyphs (drawn after outer ring, before fill) */
  strokeWidth?: number;
  /** Wider outer ring (e.g. paper-colored halo); drawn first when set */
  outerStrokeColor?: string;
  outerStrokeWidth?: number;
};

/** All parameters used by `drawSlideScene2d` for layout + typography. */
export type CanvasTokens2d = {
  padRatio: number;
  titleSizeMul: number;
  titleMinPx: number;
  titleLineMul: number;
  subtitleSizeMul: number;
  subtitleMinPx: number;
  subtitleLineMul: number;
  subtitleOpacity: number;
  bulletSizeMul: number;
  bulletMinPx: number;
  bulletLineMul: number;
  /** Extra gap before note block, as fraction of title size */
  noteTopPadMul: number;
  noteSizeMul: number;
  noteMinPx: number;
  noteOpacity: number;
  titleFont: (px: number) => string;
  subtitleFont: (px: number) => string;
  bulletFont: (px: number) => string;
  noteFont: (px: number) => string;
};

export type CanvasStyleDefinition = {
  id: CanvasStyleId;
  label?: string;
  /** When `scene.paper` / `scene.ink` are missing */
  defaultPaper: string;
  defaultInk: string;
  tokens2d: CanvasTokens2d;
  /** Targetable defaults per block (title outline, subtitle color, …) */
  blocks?: Partial<Record<CanvasBlockRole, CanvasBlockStyle>>;
  /** `u_scale` in postprocessHalftone (higher → smaller dots) */
  halftoneScale: number;
};

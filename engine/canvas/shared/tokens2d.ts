import type { CanvasTokens2d } from "../styles/types";

/** Baseline tokens used by non-theme-specific canvas slides. */
export const defaultTokens2d: CanvasTokens2d = {
  padRatio: 0.06,
  titleSizeMul: 0.042,
  titleMinPx: 28,
  titleLineMul: 1.35,
  subtitleSizeMul: 0.021,
  subtitleMinPx: 16,
  subtitleLineMul: 1.6,
  subtitleOpacity: 0.88,
  bulletSizeMul: 0.018,
  bulletMinPx: 15,
  bulletLineMul: 1.45,
  noteTopPadMul: 0.35,
  noteSizeMul: 0.016,
  noteMinPx: 13,
  noteOpacity: 0.72,
  titleFont: (px) => `700 ${px}px ui-sans-serif, system-ui, sans-serif`,
  subtitleFont: (px) => `400 ${px}px ui-sans-serif, system-ui, sans-serif`,
  bulletFont: (px) => `500 ${px}px ui-sans-serif, system-ui, sans-serif`,
  noteFont: (px) => `italic 400 ${px}px ui-serif, Georgia, serif`,
};

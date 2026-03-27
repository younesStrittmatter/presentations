import type { CanvasStyleDefinition } from "../styles/types";
import { defaultTokens2d } from "../shared/tokens2d";

/**
 * Root palette for the `retro-comic` canvas style (four-color / newsprint cues).
 * Import from `engine/canvas/styles` to reuse in scenes or custom presets.
 */
export const retroComicRoot = {
  paper: "#fdf3d7",
  paperMuted: "#f0e4c8",
  paperEdge: "#e5d4b5",
  ink: "#16130f",
  inkMuted: "#4b4235",
  processRed: "#d32f2f",
  processYellow: "#fdd835",
  processBlue: "#1565c0",
  titleYellow: "#f0c820",
  titleRed: "#8b2500",
  halo: "#fffef8",
  haloWarm: "#f5e8d4",
  outlineInk: "#1a1208",
  dropShadow: "rgba(24, 18, 10, 0.35)",
  dropShadowTitle: "rgba(255, 0, 0, 0.5)",
} as const;

/**
 * Title face for `retro-comic` (loaded via `ensureCanvasDisplayFonts` in CanvasWebGLSlide).
 * Bangers is weight 400 only; fallbacks keep a playful look offline.
 */
export const retroComicTitleFontStack =
  'Bangers, "Comic Sans MS", "Trebuchet MS", ui-rounded, cursive';

/**
 * Cover tagline + credits on `drawComicCoverLayout` — playful comic but not the title face.
 */
export const retroComicCoverBodyFontStack =
  '"Comic Neue", "Comic Sans MS", "Trebuchet MS", ui-rounded, cursive';

/** Newsprint paper + stroked title using `retroComicRoot` */
export const styleRetroComic: CanvasStyleDefinition = {
  id: "retro-comic",
  label: "Retro comic / four-color print",
  defaultPaper: retroComicRoot.paper,
  defaultInk: retroComicRoot.ink,
  tokens2d: {
    ...defaultTokens2d,
    titleSizeMul: 0.1,
    titleMinPx: 64,
    titleFont: (px) => `400 ${px}px ${retroComicTitleFontStack}`,
  },
  blocks: {
    title: {
      color: retroComicRoot.titleYellow,
      outerStrokeColor: retroComicRoot.halo,
      outerStrokeWidth: 10,
      strokeColor: retroComicRoot.outlineInk,
      strokeWidth: 8,
      shadowColor: retroComicRoot.dropShadowTitle,
      shadowBlur: 2,
      shadowOffsetX: -7,
      shadowOffsetY: 7,
      align: "right",
    },
  },
  halftoneScale: 300,
};

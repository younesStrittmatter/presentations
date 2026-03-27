import type { CanvasStyleDefinition } from "./types";
import { defaultTokens2d } from "../shared/tokens2d";
import {
  retroComicRoot,
  retroComicTitleFontStack,
  styleRetroComic,
} from "../vintage-comic/theme";
export { defaultTokens2d, retroComicRoot, retroComicTitleFontStack, styleRetroComic };

export const styleDefault: CanvasStyleDefinition = {
  id: "default",
  label: "Vintage newsprint (default)",
  defaultPaper: "#fdf3d7",
  defaultInk: "#16130f",
  tokens2d: { ...defaultTokens2d },
  halftoneScale: 142,
};

/** Dark paper, lighter ink, slightly finer halftone grid */
export const styleNoir: CanvasStyleDefinition = {
  id: "noir",
  label: "Noir / dark deck",
  defaultPaper: "#0d0d0f",
  defaultInk: "#e8e6e3",
  tokens2d: {
    ...defaultTokens2d,
    subtitleOpacity: 0.78,
    noteOpacity: 0.62,
    titleFont: (px) => `600 ${px}px "Helvetica Neue", Helvetica, ui-sans-serif, sans-serif`,
    subtitleFont: (px) => `400 ${px}px "Helvetica Neue", Helvetica, ui-sans-serif, sans-serif`,
    bulletFont: (px) => `500 ${px}px "Helvetica Neue", Helvetica, ui-sans-serif, sans-serif`,
    noteFont: (px) => `italic 400 ${px}px Georgia, ui-serif, serif`,
  },
  halftoneScale: 168,
};

/** Lighter halftone, airy type */
export const styleMinimal: CanvasStyleDefinition = {
  id: "minimal",
  label: "Minimal / light",
  defaultPaper: "#fafafa",
  defaultInk: "#1a1a1a",
  tokens2d: {
    ...defaultTokens2d,
    padRatio: 0.08,
    titleSizeMul: 0.038,
    titleMinPx: 26,
    subtitleOpacity: 0.7,
    noteOpacity: 0.55,
    titleFont: (px) => `600 ${px}px ui-sans-serif, system-ui, sans-serif`,
  },
  halftoneScale: 120,
};

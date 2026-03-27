# Psyche

Slides 1–4 use **`layout: canvas`** → **`layouts/canvas.vue`**: scenes from **`canvas-scenes.ts`** (first slide uses canvas style **`retro-comic`** and shared **`retroComicRoot`** colors from the engine). **`CanvasWebGLSlide.vue`** runs the halftone post shader each frame. Slide 5 is Markdown via **`feedback.md`**. `presentation.config.json` **`themeStyle`** is set to **`retro-comic`** for naming consistency with that look.

## Run

```bash
npm run dev -- --deck psyche
```

## Build

```bash
npm run build -- --deck psyche
```

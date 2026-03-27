/**
 * Inject display fonts used by canvas 2D text (Google Fonts). Idempotent.
 * Call and await before first `drawSlideScene2d` so metrics match.
 */
const CANVAS_DISPLAY_FONTS_LINK_ID = "presentation-engine-canvas-display-fonts";

export async function ensureCanvasDisplayFonts(): Promise<void> {
  if (!document.getElementById(CANVAS_DISPLAY_FONTS_LINK_ID)) {
    await new Promise<void>((resolve) => {
      const link = document.createElement("link");
      link.id = CANVAS_DISPLAY_FONTS_LINK_ID;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap";
      link.onload = () => resolve();
      link.onerror = () => resolve();
      document.head.appendChild(link);
    });
  }
  try {
    await Promise.all([
      document.fonts.load("400 64px Bangers"),
      document.fonts.load("700 36px Comic Neue"),
      document.fonts.load("400 18px Comic Neue"),
    ]);
  } catch {
    /* older browsers / blocked network */
  }
}

import type { CanvasBlockStyle } from "../styles/types";

export function contentAnchorX(
  pad: number,
  w: number,
  align: CanvasBlockStyle["align"] | undefined
): number {
  const contentW = w - 2 * pad;
  if (align === "center") return pad + contentW / 2;
  if (align === "right") return w - pad;
  return pad;
}

export function drawStyledTextLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  anchorX: number,
  y: number,
  ink: string,
  flowOpacity: number,
  bs: CanvasBlockStyle | undefined
): void {
  if (!text) return;

  if (!bs || !Object.keys(bs).length) {
    ctx.fillStyle = ink;
    ctx.globalAlpha = flowOpacity;
    ctx.fillText(text, anchorX, y);
    ctx.globalAlpha = 1;
    return;
  }

  const ox = bs.offsetX ?? 0;
  const oy = bs.offsetY ?? 0;
  const x = anchorX + ox;
  const yy = y + oy;
  const fill = bs.color ?? ink;
  const alpha = flowOpacity * (bs.opacity ?? 1);

  ctx.save();
  ctx.globalAlpha = alpha;

  const outerW = bs.outerStrokeWidth ?? 0;
  const hasOuter = Boolean(bs.outerStrokeColor && outerW > 0);
  const innerW = bs.strokeWidth ?? 0;
  const hasInner = Boolean(bs.strokeColor && innerW > 0);

  if (hasOuter || hasInner) {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.miterLimit = 2;
    if (hasOuter) {
      ctx.lineWidth = outerW;
      ctx.strokeStyle = bs.outerStrokeColor!;
      ctx.strokeText(text, x, yy);
    }
    if (hasInner) {
      ctx.lineWidth = innerW;
      ctx.strokeStyle = bs.strokeColor!;
      ctx.strokeText(text, x, yy);
    }
  }

  if (bs.shadowColor != null && bs.shadowColor !== "") {
    ctx.shadowColor = bs.shadowColor;
    ctx.shadowBlur = bs.shadowBlur ?? 0;
    ctx.shadowOffsetX = bs.shadowOffsetX ?? 0;
    ctx.shadowOffsetY = bs.shadowOffsetY ?? 0;
  } else {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  ctx.fillStyle = fill;
  ctx.fillText(text, x, yy);
  ctx.restore();
}

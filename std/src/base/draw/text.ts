import { Vec2 } from "../vec.ts";
import { Color } from "./color.ts";

function _colorToCss(c: Color | string) {
  if (c instanceof Color) return c.toCSS();
  return c;
}

/**
 * Draws text on the canvas.
 *
 * @param pos The position to draw the text.
 * @param text The text to draw.
 * @param font The font to use for the text.
 * @param color The color of the text.
 * @param textAlign The horizontal alignment of the text.
 * @param textBaseline The vertical alignment of the text.
 */
export function text(
  pos: Vec2,
  text: string,
  font: string = "16px Arial",
  color: Color | string = Color.fromRGB(255, 255, 255),
  textAlign: CanvasTextAlign = "center",
  textBaseline: CanvasTextBaseline = "middle",
) {
  const ctx = sim.ctx;
  ctx.font = font;
  ctx.fillStyle = _colorToCss(color);
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
  ctx.fillText(text, pos.x, pos.y);
}

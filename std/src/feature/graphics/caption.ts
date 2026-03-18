import { Display } from "../../base/display.ts";
import { Draw } from "../../base/draw/shapes.ts";
import { Vec2 } from "../../base/vec.ts";
import { Color } from "../../base/draw/color.ts";

/**
 * Options for the `addCaption` function.
 */
export interface CaptionOptions {
  text: string | (() => string);
  pos: Vec2 | (() => Vec2);
  font?: string;
  color?: Color | string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  backgroundColor?: Color | string;
  padding?: number | Vec2;
  outlineColor?: Color | string;
  outlineWidth?: number;
  lineHeight?: number;
  borderRadius?: number;
}

declare const sim: any;

/**
 * Adds a static caption (text overlay) to the display.
 * This caption is rendered in screen space and remains static regardless of camera movement.
 *
 * @param display The display instance to add the caption to.
 * @param options The options for the caption, including text, position, and styling.
 *
 * @example
 * ```ts
 * import { Simulation, Vec2, Color } from "physim/base";
 * import { addCaption } from "physim/graphics";
 *
 * const sim = new Simulation();
 *
 * addCaption(sim.display, {
 *   text: "Hello Physics!",
 *   pos: new Vec2(400, 50),
 *   backgroundColor: Color.fromHex("#00000088"),
 *   padding: 10,
 *   borderRadius: 5
 * });
 * ```
 */
export function addCaption(display: Display, options: CaptionOptions): void {
  display.addStatic((camera) => {
    const textStr = typeof options.text === "function" ? options.text() : options.text;
    const pos = typeof options.pos === "function" ? options.pos() : options.pos;
    
    const font = options.font ?? "16px Arial";
    const color = options.color ?? Color.fromRGB(255, 255, 255);
    const textAlign = options.textAlign ?? "center";
    const textBaseline = options.textBaseline ?? "middle";
    const lineHeight = options.lineHeight ?? (parseInt(font) || 20);

    const lines = textStr.split("\n");
    
    // Calculate background if needed
    if (options.backgroundColor || options.outlineColor) {
      sim.ctx.font = font;
      
      let maxWidth = 0;
      for (const line of lines) {
        const metrics = sim.ctx.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
      }
      
      let padX = 0;
      let padY = 0;
      if (typeof options.padding === "number") {
        padX = options.padding;
        padY = options.padding;
      } else if (options.padding) {
        padX = options.padding.x;
        padY = options.padding.y;
      }
      
      const totalWidth = maxWidth + padX * 2;
      const totalHeight = (lines.length * lineHeight) + padY * 2;
      
      let bgX = pos.x;
      if (textAlign === "left" || textAlign === "start") {
        bgX += (totalWidth / 2) - padX;
      } else if (textAlign === "right" || textAlign === "end") {
        bgX -= (totalWidth / 2) - padX;
      }
      
      let bgY = pos.y;
      if (textBaseline === "top" || textBaseline === "hanging") {
        bgY += (totalHeight / 2) - padY;
      } else if (textBaseline === "bottom" || textBaseline === "alphabetic" || textBaseline === "ideographic") {
        bgY -= (totalHeight / 2) - padY;
      } else if (textBaseline === "middle") {
        bgY += ((lines.length - 1) * lineHeight) / 2;
      }

      const rectPos = new Vec2(bgX, bgY);

      if (options.outlineColor && options.outlineWidth) {
        const outWidth = totalWidth + options.outlineWidth * 2;
        const outHeight = totalHeight + options.outlineWidth * 2;
        const outRad = options.borderRadius !== undefined ? options.borderRadius + options.outlineWidth : undefined;
        Draw.rect(rectPos, outWidth, outHeight, options.outlineColor, outRad);
      }
      
      if (options.backgroundColor) {
        Draw.rect(rectPos, totalWidth, totalHeight, options.backgroundColor, options.borderRadius);
      }
    }

    // Draw lines
    let currentY = pos.y;
    for (const line of lines) {
      Draw.text(new Vec2(pos.x, currentY), line, font, color, textAlign, textBaseline);
      currentY += lineHeight;
    }
  });
}

import { Vec2 } from "../vec.ts";
import { Color } from "./color.ts";

function _colorToCss(c: Color | string) {
  if (c instanceof Color) return c.toCSS();
  return c;
}

/**
 * Clears the canvas with a given color.
 *
 * @param color The color to clear the canvas with.
 */
export function clear(color: Color | string = Color.fromRGB(0, 0, 0)) {
  const ctx = sim.ctx;
  const canvas = ctx.canvas;
  ctx.fillStyle = _colorToCss(color);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draws a circle on the canvas.
 *
 * @param pos The position of the center of the circle.
 * @param radius The radius of the circle.
 * @param color The color of the circle.
 */
export function circle(
  pos: Vec2,
  radius: number,
  color: Color | string = Color.fromRGB(255, 255, 255),
) {
  const ctx = sim.ctx;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = _colorToCss(color);
  ctx.fill();
}

/**
 * Draws a rectangle on the canvas.
 *
 * @param pos The position of the center of the rectangle.
 * @param width The width of the rectangle.
 * @param height The height of the rectangle.
 * @param color The color of the rectangle.
 */
export function rect(
  pos: Vec2,
  width: number,
  height: number,
  color: Color | string = Color.fromRGB(255, 255, 255),
) {
  const ctx = sim.ctx;
  ctx.fillStyle = _colorToCss(color);
  ctx.fillRect(pos.x - width / 2, pos.y - height / 2, width, height);
}

/**
 * Draws a line on the canvas.
 *
 * @param start The start position of the line.
 * @param end The end position of the line.
 * @param color The color of the line.
 * @param lineWidth The width of the line.
 */
export function line(
  start: Vec2,
  end: Vec2,
  color: Color | string = Color.fromRGB(255, 255, 255),
  lineWidth: number = 1,
) {
  const ctx = sim.ctx;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = _colorToCss(color);
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/**
 * Draws a vector on the canvas.
 *
 * @param pos The start position of the vector.
 * @param vec The vector to draw.
 * @param color The color of the vector.
 * @param scale A scalar to multiply the vector by.
 * @param lineWidth The width of the line.
 */
export function vector(
  pos: Vec2,
  vec: Vec2,
  color: Color | string = Color.fromRGB(255, 0, 0),
  scale: number = 1,
  lineWidth: number = 2,
) {
  const end = pos.add(vec.scale(scale));
  line(pos, end, color, lineWidth);
}

/**
 * Draws a set of points on the canvas.
 *
 * @param points The points to draw.
 * @param radius The radius of the points.
 * @param color The color of the points.
 */
export function points(
  points: Vec2[],
  radius: number = 2,
  color: Color | string = Color.fromRGB(255, 255, 255),
) {
  for (const p of points) {
    circle(p, radius, color);
  }
}

/**
 * Sets the size of the canvas.
 * @param width The new width of the canvas.
 * @param height The new height of the canvas.
 */
export function setCanvasSize(width: number, height: number) {
  sim.resizeCanvas(width, height);
}

/**
 * Draws a polygon on the canvas.
 *
 * @param vertices The vertices of the polygon.
 * @param color The color of the polygon.
 * @param fill Whether to fill the polygon.
 * @param lineWidth The width of the line if not filled.
 */
export function polygon(
  vertices: Vec2[],
  color: Color | string = Color.fromRGB(255, 255, 255),
  fill: boolean = false,
  lineWidth: number = 1,
) {
  if (vertices.length < 2) {
    return; // Not enough vertices to draw a polygon
  }

  const ctx = sim.ctx;
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = _colorToCss(color);
    ctx.fill();
  } else {
    ctx.strokeStyle = _colorToCss(color);
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

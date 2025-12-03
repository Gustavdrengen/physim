import { Vec2 } from "../vec.ts";
import { Color } from "./color.ts";

function _colorToCss(c: Color | string) {
  if (c instanceof Color) return c.toCSS();
  return c;
}

export function clear(color: Color | string = Color.fromRGB(0, 0, 0)) {
  const ctx = sim.ctx;
  const canvas = ctx.canvas;
  ctx.fillStyle = _colorToCss(color);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

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

export function points(
  points: Vec2[],
  radius: number = 2,
  color: Color | string = Color.fromRGB(255, 255, 255),
) {
  for (const p of points) {
    circle(p, radius, color);
  }
}

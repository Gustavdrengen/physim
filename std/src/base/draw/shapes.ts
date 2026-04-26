import { Vec2 } from '../vec.ts';
import { Color } from './color.ts';
import { text as _text } from './text.ts';

function _colorToCss(c: Color | string): string {
  if (c instanceof Color) return c.toCSS();
  return c;
}

/**
 * A collection of drawing functions.
 *
 * @example
 * ```ts
 * import { Draw, Vec2 } from 'physim/base';
 *
 * Draw.circle(new Vec2(100, 100), 10, 'red');
 * Draw.rect(new Vec2(200, 200), 50, 50, 'blue');
 * Draw.text(new Vec2(300, 300), 'Hello', '20px Arial', 'white');
 * ```
 */
export namespace Draw {
  /**
   * Clears the canvas with a given color.
   *
   * @param color The color to clear the canvas with.
   */
  // @profile 'Draw.clear'
  export function clear(color: Color | string = Color.fromRGB(0, 0, 0)): void {
    const ctx = sim.ctx;
    const canvas = ctx.canvas;
    const colorStr = _colorToCss(color);
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    sim.clear(colorStr);
  }

  /**
   * Draws a circle on the canvas.
   *
   * @param pos The position of the center of the circle.
   * @param radius The radius of the circle.
   * @param color The color of the circle.
   */
  // @profile 'Draw.circle'
  export function circle(
    pos: Vec2,
    radius: number,
    color: Color | string = Color.fromRGB(255, 255, 255),
  ): void {
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
   * @param borderRadius Optional border radius for rounded corners.
   */
  // @profile 'Draw.rect'
  export function rect(
    pos: Vec2,
    width: number,
    height: number,
    color: Color | string = Color.fromRGB(255, 255, 255),
    borderRadius?: number,
  ): void {
    const ctx = sim.ctx;
    ctx.fillStyle = _colorToCss(color);
    if (borderRadius !== undefined) {
      ctx.beginPath();
      ctx.roundRect(pos.x - width / 2, pos.y - height / 2, width, height, borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(pos.x - width / 2, pos.y - height / 2, width, height);
    }
  }

  /**
   * Draws a line on the canvas.
   *
   * @param start The start position of the line.
   * @param end The end position of the line.
   * @param color The color of the line.
   * @param lineWidth The width of the line.
   */
  // @profile 'Draw.line'
  export function line(
    start: Vec2,
    end: Vec2,
    color: Color | string = Color.fromRGB(255, 255, 255),
    lineWidth: number = 1,
  ): void {
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
  ): void {
    const end = pos.add(vec.scale(scale));
    Draw.line(pos, end, color, lineWidth);
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
  ): void {
    for (const p of points) {
      Draw.circle(p, radius, color);
    }
  }

  /**
   * Sets the size of the canvas.
   * @param width The new width of the canvas.
   * @param height The new height of the canvas.
   */
  export function setCanvasSize(width: number, height: number): void {
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
  // @profile 'Draw.polygon'
  export function polygon(
    vertices: Vec2[],
    color: Color | string = Color.fromRGB(255, 255, 255),
    fill: boolean = false,
    lineWidth: number = 1,
  ): void {
    if (vertices.length < 2) {
      return;
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
  export const text = _text;

  /**
   * Applies a shader to the current canvas content and renders it to the main canvas.
   * After calling this, the 2D canvas is cleared.
   *
   * @param shader The shader to apply.
   */
  export function applyShader(shader: Shader): void {
    sim.applyShader(shader);
  }

  /**
   * Creates a shader program from fragment shader source.
   *
   * @param fragment The fragment shader source code.
   * @param vertex Optional custom vertex shader source.
   * @returns The created shader program.
   */
  export function createShaderProgram(fragment: string, vertex?: string): ShaderProgram {
    return sim.createShaderProgram(fragment, vertex);
  }

  /**
   * Creates a shader instance from a program with specified configuration.
   *
   * @param program The shader program to use.
   * @param config Optional configuration including uniforms and blend mode.
   * @returns The created shader instance.
   */
  export function createShader(program: ShaderProgram, config?: ShaderConfig): Shader {
    return sim.createShader(program, config);
  }

  /**
   * Updates uniforms on an existing shader instance.
   *
   * @param shader The shader to update.
   * @param uniforms The new uniform values.
   */
  export function setShaderUniforms(
    shader: Shader,
    uniforms: Record<string, UniformDefinition>,
  ): void {
    sim.setShaderUniforms(shader, uniforms);
  }
}

import { Vec2 } from "../../base/vec.ts";

/**
 * A geometric shape.
 */
export type Shape = Circle | Polygon;

/**
 * A circle shape.
 */
export interface Circle {
  type: "circle";
  radius: number;
}

/**
 * A polygon shape.
 */
export interface Polygon {
  type: "polygon";
  /**
   * The vertices of the polygon in local space.
   */
  vertices: Vec2[];
}

/**
 * Creates a new circle shape.
 *
 * @param radius The radius of the circle.
 * @returns A new circle shape.
 */
export function createCircle(radius: number): Circle {
  return { type: "circle", radius };
}

/**
 * Creates a new rectangle shape as a polygon.
 *
 * @param width The width of the rectangle.
 * @param height The height of the rectangle.
 * @returns A new polygon shape representing a rectangle.
 */
export function createRectangle(width: number, height: number): Polygon {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return {
    type: "polygon",
    vertices: [
      new Vec2(-halfWidth, -halfHeight),
      new Vec2(halfWidth, -halfHeight),
      new Vec2(halfWidth, halfHeight),
      new Vec2(-halfWidth, halfHeight),
    ],
  };
}

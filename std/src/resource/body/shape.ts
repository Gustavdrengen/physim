import { Vec2 } from "../../base/vec.ts";

/**
 * A geometric shape.
 */
export type Shape = Circle | Polygon | Ring;

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
 * A ring shape
 */
export interface Ring {
  type: "ring";
  innerRadius: number;
  outerRadius: number;
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
 * Creates a new ring shape.
 *
 * @param innerRadius The inner radius of the ring.
 * @param outerRadius The outer radius of the ring.
 * @returns A new ring shape.
 *
 */
export function createRing(innerRadius: number, outerRadius: number): Ring {
  return { type: "ring", innerRadius, outerRadius };
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

import { Vec2 } from "../../base/vec.ts";

/**
 * A geometric shape.
 */
export type Shape = Circle | Polygon | Ring | HollowPolygon;

/**
 * A circle shape.
 */
export interface Circle {
  /**
   * The type of the shape.
   */
  type: "circle";
  /**
   * The radius of the circle.
   */
  radius: number;
}

/**
 * A polygon shape.
 */
export interface Polygon {
  /**
   * The type of the shape.
   */
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
  /**
   * The type of the shape.
   */
  type: "ring";
  /**
   * The inner radius of the ring.
   */
  innerRadius: number;
  /**
   * The outer radius of the ring.
   */
  outerRadius: number;
  /**
   * An array of gaps in the ring.
   */
  gaps: {
    startAngle: number;
    size: number;
  }[];
}

/**
 * A hollow polygon shape.
 */
export interface HollowPolygon {
  /**
   * The type of the shape.
   */
  type: "hollow_polygon";
  /**
   * The vertices of the polygon in local space.
   */
  vertices: Vec2[];
  /**
   * The width of the polygon walls.
   */
  width: number;
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
 * @param gaps An array of gaps in the ring.
 * @returns A new ring shape.
 *
 */
export function createRing(
  innerRadius: number,
  outerRadius: number,
  gaps: { startAngle: number; size: number }[] = [],
): Ring {
  if (outerRadius < innerRadius) {
    throw new Error(
      "Outer radius must be greater than or equal to inner radius",
    );
  }
  return { type: "ring", innerRadius, outerRadius, gaps };
}

/**
 * Creates a new polygon shape.
 *
 * @param vertices The vertices of the polygon in local space.
 * @returns A new polygon shape.
 */
export function createPolygon(vertices: Vec2[]): Polygon {
  return { type: "polygon", vertices };
}

/**
 * Creates a new hollow polygon shape.
 *
 * @param vertices The vertices of the polygon in local space.
 * @param width The width of the polygon walls.
 * @returns A new hollow polygon shape.
 */
export function createHollowPolygon(
  vertices: Vec2[],
  width: number,
): HollowPolygon {
  return { type: "hollow_polygon", vertices, width };
}

/**
 * Creates a new regular polygon shape.
 *
 * @param sides The number of sides of the polygon.
 * @param radius The radius of the polygon.
 * @returns A new regular polygon shape.
 */
export function createRegularPolygon(sides: number, radius: number): Polygon {
  return {
    type: "polygon",
    vertices: getRegularPolygonVertices(sides, radius),
  };
}

/**
 * Generates the vertices for a regular polygon.
 *
 * @param sides The number of sides of the polygon.
 * @param radius The radius of the polygon.
 * @returns The vertices of the regular polygon.
 */
export function getRegularPolygonVertices(sides: number, radius: number): Vec2[] {
  const vertices: Vec2[] = [];
  const angleStep = (Math.PI * 2) / sides;
  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep;
    vertices.push(new Vec2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  return vertices;
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

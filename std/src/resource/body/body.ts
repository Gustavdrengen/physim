import { Vec2 } from "../../base/vec.ts";
import { Component } from "../../base/entity.ts";
import { Shape } from "./shape.ts";
import { Color } from "../../base/draw/color.ts";
import { polygon } from "../../base/draw/shapes.ts";

/**
 * Represents a part of a composite body, associating a shape
 * with a local position and rotation.
 */
export interface BodyPart {
  /**
   * The geometric shape of this part.
   */
  shape: Shape;
  /**
   * The position of this part relative to the center of the parent body.
   */
  position: Vec2;
  /**
   * The rotation of this part in radians, relative to the parent body's rotation.
   */
  rotation: number;
}

/**
 * A data component for the physical properties of an entity.
 * It can be composed of multiple parts. The vertices and AABB are in local space.
 */
export class Body {
  /**
   * An array of `BodyPart` objects that compose this body.
   */
  readonly parts: readonly BodyPart[];
  /**
   * The combined vertices of all parts in local space, grouped by polygon.
   * @readonly
   */
  readonly vertices: readonly (readonly Vec2[])[];
  /**
   * The axis-aligned bounding box (AABB) of the body in local space.
   * This box completely encloses the body.
   */
  readonly aabb: {
    /** The minimum corner (bottom-left) of the AABB. */
    min: Vec2;
    /** The maximum corner (top-right) of the AABB. */
    max: Vec2;
  };
  /**
   * The overall rotation of the body in radians.
   */
  rotation: number;

  /**
   * Creates a new Body instance.
   *
   * @param parts An array of `BodyPart` objects that compose this body.
   * @param initialRotation The initial rotation of the body in radians.
   */
  constructor(parts: BodyPart[], initialRotation: number = 0) {
    this.parts = parts;
    this.rotation = initialRotation;

    const allVertices: Vec2[][] = [];
    for (const part of parts) {
      const partVertices = Body.calculatePartVertices(part);
      allVertices.push(...partVertices);
    }

    this.vertices = allVertices;
    this.aabb = Body.calculateAABB(this.vertices.flat());
  }

  /**
   * Draws the body on a canvas.
   * @param pos The position of the body.
   * @param color The color to draw the body with.
   * @param fill Whether to fill the body.
   * @param lineWidth The width of the line if not filled.
   * @param scale The scale of the body.
   */
  public draw(pos: Vec2, color: Color, fill: boolean = true, lineWidth: number = 1, scale: number = 1) {
    const rot = this.rotation;
    for (const poly of this.vertices) {
      const transformedVertices: Vec2[] = poly.map((v: Vec2) => {
        const scaledV = v.scale(scale);
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        const rotatedX = scaledV.x * cos - scaledV.y * sin;
        const rotatedY = scaledV.x * sin + scaledV.y * cos;

        return new Vec2(rotatedX + pos.x, rotatedY + pos.y);
      });
      polygon(transformedVertices, color, fill, lineWidth);
    }
  }

  /**
   * Creates a new Body from a single shape.
   * The shape will be centered at the body's origin.
   *
   * @param shape The shape to create the body from.
   * @param initialRotation The initial rotation of the body in radians.
   * @returns A new Body instance.
   */
  static fromShape(shape: Shape, initialRotation: number = 0): Body {
    return new Body([
      {
        shape,
        position: Vec2.zero(),
        rotation: 0,
      },
    ], initialRotation);
  }

  private static createRingSegment(
    startAngle: number,
    endAngle: number,
    innerRadius: number,
    outerRadius: number,
  ): Vec2[] {
    const vertices: Vec2[] = [];
    const segments = Math.ceil((endAngle - startAngle) / (Math.PI / 16)); // 32 segments for a full circle

    const angleStep = (endAngle - startAngle) / segments;

    // Outer arc
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + i * angleStep;
      vertices.push(new Vec2(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius));
    }

    // Inner arc (reversed)
    for (let i = segments; i >= 0; i--) {
      const angle = startAngle + i * angleStep;
      vertices.push(new Vec2(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius));
    }

    return vertices;
  }

  private static calculatePartVertices(part: BodyPart): Vec2[][] {
    const { shape, position, rotation } = part;
    let basePolygons: Vec2[][];

    if (shape.type === "circle") {
      // Approximate circle with 32 vertices for general vertex handling
      const baseVertices: Vec2[] = [];
      for (let i = 0; i < 32; i++) {
        const angle = (i / 32) * 2 * Math.PI;
        baseVertices.push(
          new Vec2(
            Math.cos(angle) * shape.radius,
            Math.sin(angle) * shape.radius
          )
        );
      }
      basePolygons = [baseVertices];
    } else if (shape.type === "ring") {
      const { innerRadius, outerRadius, gaps } = shape;
      basePolygons = [];

      if (outerRadius > innerRadius) {
        const sortedGaps = [...gaps].sort((a, b) => a.startAngle - b.startAngle);
        let currentAngle = 0;

        for (const gap of sortedGaps) {
          if (gap.startAngle > currentAngle) {
            basePolygons.push(
              Body.createRingSegment(
                currentAngle,
                gap.startAngle,
                innerRadius,
                outerRadius
              )
            );
          }
          currentAngle = gap.startAngle + gap.size;
        }

        if (currentAngle < 2 * Math.PI) {
          basePolygons.push(
            Body.createRingSegment(
              currentAngle,
              2 * Math.PI,
              innerRadius,
              outerRadius
            )
          );
        }
      }
    } else if (shape.type === "polygon") {
      basePolygons = [shape.vertices];
    } else {
      basePolygons = [];
    }

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    return basePolygons.map((poly) =>
      poly.map((v) =>
        new Vec2(
          v.x * cos - v.y * sin + position.x,
          v.x * sin + v.y * cos + position.y
        )
      )
    );
  }

  private static calculateAABB(
    vertices: readonly Vec2[]
  ): { min: Vec2; max: Vec2 } {
    if (vertices.length === 0) {
      return { min: Vec2.zero(), max: Vec2.zero() };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const v of vertices) {
      if (v.x < minX) minX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.x > maxX) maxX = v.x;
      if (v.y > maxY) maxY = v.y;
    }

    return { min: new Vec2(minX, minY), max: new Vec2(maxX, maxY) };
  }
}

/**
 * Initializes a new body component.
 *
 * @returns The new component.
 *
 * @example
 * ```ts
 * import { Entity } from "physim/ecs";
 * import { Vec2 } from "physim/vec";
 * import { createRectangle, initBodyComponent, Body } from "physim/bodies";
 *
 * const bodyComponent = initBodyComponent();
 *
 * const body = Body.fromShape(createRectangle(10, 10));
 *
 * const entity = Entity.create(
 *   new Vec2(100, 100),
 *   [[bodyComponent, body]]
 * );
 * ```
 */
export function initBodyComponent(): Component<Body> {
  return new Component<Body>();
}

import { Vec2 } from "../../base/vec.ts";
import { Component } from "../../base/entity.ts";
import { Shape } from "./shape.ts";

/**
 * Represents a part of a composite body, associating a shape
 * with a local position and rotation.
 */
export interface BodyPart {
  shape: Shape;
  position: Vec2;
  rotation: number;
}

/**
 * A data component for the physical properties of an entity.
 * It can be composed of multiple parts. The vertices and AABB are in local space.
 */
export class Body {
  readonly parts: readonly BodyPart[];
  // TODO: I think this is unused
  readonly vertices: readonly Vec2[];
  readonly aabb: { min: Vec2; max: Vec2 };
  rotation: number;

  constructor(parts: BodyPart[], initialRotation: number = 0) {
    this.parts = parts;
    this.rotation = initialRotation;

    const allVertices: Vec2[] = [];
    for (const part of parts) {
      const partVertices = Body.calculatePartVertices(part);
      allVertices.push(...partVertices);
    }

    this.vertices = allVertices;
    this.aabb = Body.calculateAABB(this.vertices);
  }

  /**
   * Creates a new Body from a single shape.
   * The shape will be centered at the body's origin.
   *
   * @param shape The shape to create the body from.
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

  private static calculatePartVertices(part: BodyPart): Vec2[] {
    const { shape, position, rotation } = part;
    let baseVertices: Vec2[];

    if (shape.type === "circle") {
      // Approximate circle with 32 vertices for general vertex handling
      baseVertices = [];
      for (let i = 0; i < 32; i++) {
        const angle = (i / 32) * 2 * Math.PI;
        baseVertices.push(
          new Vec2(
            Math.cos(angle) * shape.radius,
            Math.sin(angle) * shape.radius
          )
        );
      }
    } else if (shape.type === "ring") {
      baseVertices = [];

      const segments = 128;
      const outerR = shape.outerRadius;
      const innerR = shape.innerRadius;

      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        baseVertices.push(new Vec2(
          Math.cos(angle) * outerR,
          Math.sin(angle) * outerR
        ));
      }

      for (let i = segments - 1; i >= 0; i--) {
        const angle = (i / segments) * Math.PI * 2;
        baseVertices.push(new Vec2(
          Math.cos(angle) * innerR,
          Math.sin(angle) * innerR
        ));
      }

    } else if (shape.type === "polygon") {
      baseVertices = shape.vertices;
    } else {
      baseVertices = [];
    }

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    return baseVertices.map((v) =>
      new Vec2(
        v.x * cos - v.y * sin + position.x,
        v.x * sin + v.y * cos + position.y
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
 * const bodyData = new Body([{
 *   shape: createRectangle(10, 10),
 *   position: Vec2.zero(),
 *   rotation: 0
 * }]);
 *
 * const entity = new Entity(new Vec2(100, 100));
 * entity.addComp(bodyComponent, bodyData);
 * ```
 */
export function initBodyComponent(): Component<Body> {
  return new Component<Body>();
}

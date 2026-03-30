import { Vec2 } from "../../base/vec.ts";
import { Component, Entity } from "../../base/entity.ts";
import { Shape } from "./shape.ts";
import { Color } from "../../base/draw/color.ts";
import { Draw } from "../../base/draw/shapes.ts";
import { Physics } from "../../base/physics.ts";

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
   * The angular velocity of the body in radians per second.
   * This is automatically integrated into rotation each frame.
   */
  angularVelocity: number;

  /**
   * Creates a new Body instance.
   *
   * @param parts An array of `BodyPart` objects that compose this body.
   * @param initialRotation The initial rotation of the body in radians.
   * @param initialAngularVelocity The initial angular velocity of the body in radians per second.
   */
  constructor(parts: BodyPart[], initialRotation: number = 0, initialAngularVelocity: number = 0) {
    this.parts = parts;
    this.rotation = initialRotation;
    this.angularVelocity = initialAngularVelocity;

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
  // @profile "Body.draw"
  public draw(pos: Vec2, color: Color, fill: boolean = true, lineWidth: number = 1, scale: number = 1): void {
    const rot = this.rotation;
    // @profile-start "Body.draw.transformVertices"
    for (const poly of this.vertices) {
      const transformedVertices: Vec2[] = poly.map((v: Vec2) => {
        const scaledV = v.scale(scale);
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        const rotatedX = scaledV.x * cos - scaledV.y * sin;
        const rotatedY = scaledV.x * sin + scaledV.y * cos;

        return new Vec2(rotatedX + pos.x, rotatedY + pos.y);
      });
      Draw.polygon(transformedVertices, color, fill, lineWidth);
    }
    // @profile-end
  }

  /**
   * Creates a new Body from a single shape.
   * The shape will be centered at the body's origin.
   *
   * @param shape The shape to create the body from.
   * @param initialRotation The initial rotation of the body in radians.
   * @param initialAngularVelocity The initial angular velocity of the body in radians per second.
   * @returns A new Body instance.
   */
  static fromShape(shape: Shape, initialRotation: number = 0, initialAngularVelocity: number = 0): Body {
    return new Body([
      {
        shape,
        position: Vec2.zero(),
        rotation: 0,
      },
    ], initialRotation, initialAngularVelocity);
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

  // @profile "Body.calculatePartVertices"
  private static calculatePartVertices(part: BodyPart): Vec2[][] {
    const { shape, position, rotation } = part;
    let basePolygons: Vec2[][];

    if (shape.type === "circle") {
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
    } else if (shape.type === "hollow_polygon") {
      const { vertices, width } = shape;
      basePolygons = [];
      const halfWidth = width / 2;

      const innerVertices: Vec2[] = [];
      const outerVertices: Vec2[] = [];

      for (let i = 0; i < vertices.length; i++) {
        const vPrev = vertices[(i + vertices.length - 1) % vertices.length];
        const vCurr = vertices[i];
        const vNext = vertices[(i + 1) % vertices.length];

        const seg1 = vCurr.sub(vPrev).normalize();
        const seg2 = vNext.sub(vCurr).normalize();

        const n1 = new Vec2(-seg1.y, seg1.x);
        const n2 = new Vec2(-seg2.y, seg2.x);

        const miter = n1.add(n2).normalize();
        const dot = miter.dot(n1);
        const length = dot === 0 ? halfWidth : halfWidth / dot;

        outerVertices.push(vCurr.add(miter.scale(length)));
        innerVertices.push(vCurr.sub(miter.scale(length)));
      }

      for (let i = 0; i < vertices.length; i++) {
        const next = (i + 1) % vertices.length;
        basePolygons.push([
          outerVertices[i],
          outerVertices[next],
          innerVertices[next],
          innerVertices[i],
        ]);
      }
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

  // @profile "Body.calculateAABB"
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

  /**
   * Splits a body into multiple shards.
   *
   * @param body The body to split.
   * @param numShards The number of shards to create.
   * @returns An array of new Body instances, each representing a shard.
   */
  // @profile "Body.split"
  static split(body: Body, numShards: number): Body[] {
    const shards: Body[] = [];
    const rotation = body.rotation;

    // @profile-start "Body.split.polygons"
    for (const poly of body.vertices) {
      if (poly.length < 3) continue;

      let centerX = 0;
      let centerY = 0;
      for (const v of poly) {
        centerX += v.x;
        centerY += v.y;
      }
      centerX /= poly.length;
      centerY /= poly.length;
      const center = new Vec2(centerX, centerY);

      for (let i = 0; i < numShards; i++) {
        const startIdx = Math.floor((i / numShards) * poly.length);
        let endIdx = Math.floor(((i + 1) / numShards) * poly.length);

        if (endIdx === startIdx) {
          if (i === numShards - 1) {
            endIdx = poly.length;
          } else {
             continue;
          }
        }
        
        if (endIdx === startIdx) continue;

        const shardVertices: Vec2[] = [center];
        for (let j = startIdx; j <= endIdx; j++) {
          shardVertices.push(poly[j % poly.length]);
        }

        shards.push(
          Body.fromShape(
            { type: "polygon", vertices: shardVertices },
            rotation
          )
        );
      }
    }
    // @profile-end

    return shards;
  }
}

/**
 * Initializes a new body component and registers angular velocity integration with the physics system.
 *
 * @param physics The physics system to register with.
 * @returns The new component.
 *
 * @example
 * ```ts
 * import { Simulation, Entity, Vec2 } from "physim/base";
 * import { createRectangle, initBodyComponent, Body } from "physim/bodies";
 *
 * const simulation = new Simulation();
 * const bodyComponent = initBodyComponent(simulation.physics);
 *
 * const body = Body.fromShape(createRectangle(10, 10));
 * body.angularVelocity = Math.PI; // Rotate at 180 degrees per second
 *
 * const entity = Entity.create(
 *   new Vec2(100, 100),
 *   [[bodyComponent, body]]
 * );
 * ```
 */
export function initBodyComponent(physics: Physics): Component<Body> {
  const bodyComponent = new Component<Body>();

  physics.registerForce(
    bodyComponent,
    (entity: Entity, body: Body) => {
      body.rotation += body.angularVelocity * (1 / 60);
    },
    2,
  );

  return bodyComponent;
}
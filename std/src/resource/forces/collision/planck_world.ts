import * as planck from "planck";
import { Physics } from "../../../base/physics.ts";
import { Vec2 } from "../../../base/vec.ts";
import { Entity, Component } from "../../../base/entity.ts";
import { Body } from "../../../feature/bodies/body.ts";
import { DefaultCollisionProperties, CollisionEvent } from "./types.ts";
import { WorldPort } from "./world_port.ts";

export type { DefaultCollisionProperties };

const SCALE = 50;

interface EntityData {
  body: planck.Body;
  bodySignature: string;
  defaultProps: DefaultCollisionProperties;
  restitution: number;
}

export class PlanckWorldManager implements WorldPort {
  private _world: planck.World;
  private _physics: Physics;
  private _bodyComponent: Component<Body>;
  private _staticComponent: Component<boolean>;
  private _restitutionComponent: Component<number>;
  private _entityToData: Map<Entity, EntityData> = new Map();
  private _entities: Entity[] = [];
  private _pendingCollisions: CollisionEvent[] = [];
  private _initialized = false;

  constructor(
    physics: Physics,
    bodyComponent: Component<Body>,
    staticComponent: Component<boolean>,
    restitutionComponent: Component<number>,
  ) {
    this._physics = physics;
    this._bodyComponent = bodyComponent;
    this._staticComponent = staticComponent;
    this._restitutionComponent = restitutionComponent;
    this._world = new planck.World({
      gravity: new planck.Vec2(0, 0),
    });

    this._world.on("begin-contact", (contact: planck.Contact) => {
      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();

      const entityA = this.getEntityFromFixture(fixtureA);
      const entityB = this.getEntityFromFixture(fixtureB);

      if (!entityA || !entityB) return;
      if (entityA === entityB) return;

      const bodyA = fixtureA.getBody();
      const bodyB = fixtureB.getBody();
      const velA = bodyA.getLinearVelocity();
      const velB = bodyB.getLinearVelocity();

      const wm = new planck.WorldManifold();
      (contact as any).getWorldManifold(wm);

      let position = new Vec2(0, 0);

      if (wm.pointCount > 0) {
        const wp = wm.points[0];
        position = new Vec2(wp.x * SCALE, wp.y * SCALE);
      } else {
        const posA = fixtureA.getBody().getPosition();
        position = new Vec2(posA.x * SCALE, posA.y * SCALE);
      }

      this._pendingCollisions.push({
        entityA,
        entityB,
        position,
      });
    });
  }

  async init(): Promise<void> {
    this._initialized = true;
  }

  addEntity(
    entity: Entity,
    body: Body,
    defaultProps: DefaultCollisionProperties,
  ): void {
    if (!this._initialized) {
      throw new Error("PlanckWorldManager not initialized. Call init() first.");
    }

    const existing = this._entityToData.get(entity);
    if (existing) {
      return;
    }

    const isStatic = this._staticComponent.get(entity) ?? false;

    const bodyDef: any = {
      type: isStatic ? "static" : "dynamic",
      position: { x: entity.pos.x / SCALE, y: entity.pos.y / SCALE },
      angle: body.rotation,
      allowSleep: false,
      awake: true,
    };

    if (!isStatic) {
      bodyDef.linearDamping = 0;
      bodyDef.angularDamping = 0;
      bodyDef.bullet = true;
    }

    const planckBody = this._world.createBody(bodyDef);

    const fixtureDef: any = {
      friction: defaultProps.friction ?? 0.0,
      restitution: defaultProps.restitution ?? 1.0,
    };

    if (defaultProps.sensor) {
      fixtureDef.isSensor = true;
    }

    const restitution = this.getRestitutionForEntity(
      entity,
      defaultProps.restitution ?? 1.0,
    );

    for (const part of body.parts) {
      const shapes = this.createPlanckShapes(part.shape);
      const density = isStatic
        ? 0
        : (this._physics.mass.get(entity) ?? defaultProps.mass ?? 1.0) /
          this.computeArea(part.shape);
      for (const shape of shapes) {
        const fixture = planckBody.createFixture(shape, {
          density: Math.max(density, 0.001),
          friction: defaultProps.friction ?? 0.5,
          restitution: restitution,
        });
        if (defaultProps.sensor) {
          (fixture as any)?.setSensor(true);
        }
      }
    }

    this._entityToData.set(entity, {
      body: planckBody,
      bodySignature: this.computeBodySignature(body),
      defaultProps,
      restitution,
    });
    this._entities.push(entity);
  }

  removeEntity(entity: Entity): void {
    const data = this._entityToData.get(entity);
    if (data) {
      this._world.destroyBody(data.body);
      this._entityToData.delete(entity);
      this._entities = this._entities.filter((e) => e !== entity);
    }
  }

  hasEntity(entity: Entity): boolean {
    return this._entityToData.has(entity);
  }

  getEntities(): Entity[] {
    return [...this._entities];
  }

  step(): void {
    if (!this._initialized) {
      throw new Error("PlanckWorldManager not initialized. Call init() first.");
    }

    this._pendingCollisions = [];

    for (const [entity, data] of this._entityToData) {
      const bodyComp = entity.getComp(this._bodyComponent);
      if (!bodyComp) continue;

      if (data.body.isStatic()) {
        data.body.setPosition({
          x: entity.pos.x / SCALE,
          y: entity.pos.y / SCALE,
        });
        data.body.setAngle(bodyComp.rotation);
      } else {
        const velocity = this._physics.velocity.get(entity);
        const vel = velocity ?? { x: 0, y: 0 };
        data.body.setLinearVelocity({ x: vel.x / SCALE, y: vel.y / SCALE });
        data.body.setAngularVelocity(bodyComp.angularVelocity);
        data.body.setAngle(bodyComp.rotation);
      }
    }

    this._world.step(1 / 60);

    for (const [entity, data] of this._entityToData) {
      if (data.body.isStatic()) continue;
      const vel = data.body.getLinearVelocity();
    }

    for (const [entity, data] of this._entityToData) {
      this.updateRestitution(entity, data);
      const bodyComp = entity.getComp(this._bodyComponent);
      if (!bodyComp) continue;

      if (data.body.isStatic()) {
        continue;
      }

      const pos = data.body.getPosition();
      entity.pos.x = pos.x * SCALE;
      entity.pos.y = pos.y * SCALE;

      const linvel = data.body.getLinearVelocity();
      (this._physics.velocity as Component<Vec2>).set(
        entity,
        new Vec2(linvel.x * SCALE, linvel.y * SCALE),
      );
      const syncedVel = this._physics.velocity.get(entity);

      bodyComp.angularVelocity = data.body.getAngularVelocity();
      bodyComp.rotation = data.body.getAngle();
    }
  }

  getCollisionEvents(): CollisionEvent[] {
    return this._pendingCollisions;
  }

  private getRestitutionForEntity(
    entity: Entity,
    defaultRestitution: number,
  ): number {
    const restitution = this._restitutionComponent.get(entity);
    return restitution ?? defaultRestitution;
  }

  private updateRestitution(entity: Entity, data: EntityData): void {
    const newRestitution = this.getRestitutionForEntity(
      entity,
      data.defaultProps.restitution ?? 1.0,
    );
    if (newRestitution !== data.restitution) {
      data.restitution = newRestitution;
      let fixture = data.body.getFixtureList();
      while (fixture) {
        fixture.setRestitution(newRestitution);
        fixture = fixture.getNext();
      }
    }
  }

  syncRigidBodyToEntity(entity: Entity): void {}

  syncEntityToRigidBody(entity: Entity): void {}

  private createPlanckShapes(shape: Body["parts"][0]["shape"]): planck.Shape[] {
    switch (shape.type) {
      case "circle": {
        return [planck.Circle(shape.radius / SCALE)];
      }
      case "polygon": {
        return [
          planck.Polygon(
            shape.vertices.map((v: Vec2) => ({
              x: v.x / SCALE,
              y: v.y / SCALE,
            })),
          ),
        ];
      }
      case "ring": {
        return this.createRingShapes(shape);
      }
      case "hollow_polygon": {
        return this.createHollowPolygonShapes(shape);
      }
      default:
        return [];
    }
  }

  private createRingShapes(shape: {
    innerRadius: number;
    outerRadius: number;
    gaps: { startAngle: number; size: number }[];
  }): planck.Shape[] {
    const shapes: planck.Shape[] = [];

    const sortedGaps = [...shape.gaps].sort(
      (a, b) => a.startAngle - b.startAngle,
    );
    let currentAngle = 0;

    for (const gap of sortedGaps) {
      if (gap.startAngle > currentAngle) {
        const segmentShapes = this.createRingSegmentShapes(
          currentAngle,
          gap.startAngle,
          shape.innerRadius / SCALE,
          shape.outerRadius / SCALE,
        );
        shapes.push(...segmentShapes);
      }
      currentAngle = gap.startAngle + gap.size;
    }

    if (currentAngle < 2 * Math.PI) {
      const segmentShapes = this.createRingSegmentShapes(
        currentAngle,
        2 * Math.PI,
        shape.innerRadius / SCALE,
        shape.outerRadius / SCALE,
      );
      shapes.push(...segmentShapes);
    }

    return shapes;
  }

  private createRingSegmentShapes(
    startAngle: number,
    endAngle: number,
    innerRadius: number,
    outerRadius: number,
  ): planck.Shape[] {
    const shapes: planck.Shape[] = [];
    const arcSegments = Math.max(
      1,
      Math.ceil((endAngle - startAngle) / (Math.PI / 16)),
    );
    const angleStep = (endAngle - startAngle) / arcSegments;

    for (let i = 0; i < arcSegments; i++) {
      const a0 = startAngle + i * angleStep;
      const a1 = startAngle + (i + 1) * angleStep;

      const v0 = {
        x: Math.cos(a0) * innerRadius,
        y: Math.sin(a0) * innerRadius,
      };
      const v1 = {
        x: Math.cos(a0) * outerRadius,
        y: Math.sin(a0) * outerRadius,
      };
      const v2 = {
        x: Math.cos(a1) * outerRadius,
        y: Math.sin(a1) * outerRadius,
      };
      const v3 = {
        x: Math.cos(a1) * innerRadius,
        y: Math.sin(a1) * innerRadius,
      };

      shapes.push(planck.Polygon([v0, v1, v2]));
      shapes.push(planck.Polygon([v0, v2, v3]));
    }

    return shapes;
  }

  private createHollowPolygonShapes(shape: {
    vertices: Vec2[];
    width: number;
  }): planck.Shape[] {
    const halfWidth = shape.width / 2 / SCALE;
    const innerVertices: Vec2[] = [];
    const outerVertices: Vec2[] = [];

    for (let i = 0; i < shape.vertices.length; i++) {
      const vPrev =
        shape.vertices[(i + shape.vertices.length - 1) % shape.vertices.length];
      const vCurr = shape.vertices[i];
      const vNext = shape.vertices[(i + 1) % shape.vertices.length];

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

    const shapes: planck.Shape[] = [];

    for (let i = 0; i < shape.vertices.length; i++) {
      const next = (i + 1) % shape.vertices.length;

      const quad: { x: number; y: number }[] = [
        { x: outerVertices[i].x / SCALE, y: outerVertices[i].y / SCALE },
        { x: outerVertices[next].x / SCALE, y: outerVertices[next].y / SCALE },
        { x: innerVertices[next].x / SCALE, y: innerVertices[next].y / SCALE },
        { x: innerVertices[i].x / SCALE, y: innerVertices[i].y / SCALE },
      ];

      shapes.push(planck.Polygon(quad));
    }

    return shapes;
  }

  private computeBodySignature(body: Body): string {
    return JSON.stringify(
      body.parts.map((part) => ({
        position: { x: part.position.x, y: part.position.y },
        rotation: part.rotation,
        shape: this.serializeShape(part.shape),
      })),
    );
  }

  private serializeShape(shape: Body["parts"][0]["shape"]): unknown {
    switch (shape.type) {
      case "circle":
        return { type: shape.type, radius: shape.radius };
      case "polygon":
        return {
          type: shape.type,
          vertices: shape.vertices.map((v: Vec2) => [v.x, v.y]),
        };
      case "ring":
        return {
          type: shape.type,
          innerRadius: shape.innerRadius,
          outerRadius: shape.outerRadius,
        };
      case "hollow_polygon":
        return { type: shape.type, width: shape.width };
      default:
        return shape;
    }
  }

  private computeArea(shape: Body["parts"][0]["shape"]): number {
    switch (shape.type) {
      case "circle":
        return Math.PI * shape.radius * shape.radius;
      case "polygon": {
        let area = 0;
        const verts = shape.vertices;
        for (let i = 0; i < verts.length; i++) {
          const j = (i + 1) % verts.length;
          area += verts[i].x * verts[j].y - verts[j].x * verts[i].y;
        }
        return Math.abs(area) / 2;
      }
      case "ring":
        return Math.PI * (shape.outerRadius ** 2 - shape.innerRadius ** 2);
      case "hollow_polygon": {
        let perimeter = 0;
        for (let i = 0; i < shape.vertices.length; i++) {
          const j = (i + 1) % shape.vertices.length;
          perimeter += shape.vertices[i].sub(shape.vertices[j]).length();
        }
        return perimeter * shape.width;
      }
      default:
        return 1;
    }
  }

  private getEntityFromBody(body: planck.Body): Entity | undefined {
    for (const [entity, data] of this._entityToData) {
      if (data.body === body) {
        return entity;
      }
    }
    return undefined;
  }

  private getEntityFromFixture(fixture: planck.Fixture): Entity | undefined {
    const body = fixture.getBody();
    return this.getEntityFromBody(body);
  }
}

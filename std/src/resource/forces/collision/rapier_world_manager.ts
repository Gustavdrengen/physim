import * as RAPIER from "@dimforge/rapier2d-compat";

import { Vec2 } from "../../../base/vec";
import { Entity, Component } from "../../../base/entity";
import { CollisionEvent } from "./events";
import { Body, BodyPart } from "../../body/body";
import { Physics } from "../../../base/physics";

export type DefaultCollisionProperties = {
  bodyType?:
    | "dynamic"
    | "static"
    | "kinematicPositionBased"
    | "kinematicVelocityBased";
  mass?: number;
  friction?: number;
  restitution?: number;
  sensor?: boolean;
  collisionGroups?: number;
  solverGroups?: number;
};

export class RapierWorldManager {
  private _rapierWorld: RAPIER.World | null = null;
  private _eventQueue: RAPIER.EventQueue | null = null;
  private _entityToRapierMap: Map<
    Entity,
    { rigidBody: RAPIER.RigidBody; colliders: RAPIER.Collider[] }
  > = new Map();
  private _colliderHandleToEntityMap: Map<number, Entity> = new Map();
  private _physics: Physics;
  private _bodyComponent: Component<Body>;
  private _staticComponent: Component<boolean>;

  constructor(
    physics: Physics,
    bodyComponent: Component<Body>,
    staticComponent: Component<boolean>,
  ) {
    this._physics = physics;
    this._bodyComponent = bodyComponent;
    this._staticComponent = staticComponent;
  }

  async init(): Promise<void> {
    await RAPIER.init();
    this._eventQueue = new RAPIER.EventQueue(true);
    this._rapierWorld = new RAPIER.World(new RAPIER.Vector2(0, 0));
  }

  step(): void {
    if (!this._rapierWorld || !this._eventQueue) {
      throw new Error("RapierWorldManager not initialized. Call init() first.");
    }
    this._rapierWorld.step(this._eventQueue);
  }

  addEntity(entity: Entity, defaultProps: DefaultCollisionProperties): void {
    const body = entity.getComp(this._bodyComponent);
    if (!body) {
      throw new Error(
        "Entity must have a Body component to be added to RapierWorldManager.",
      );
    }
    if (!this._rapierWorld) {
      throw new Error("RapierWorldManager not initialized. Call init() first.");
    }

    const rigidBody = this.createRigidBody(entity, body, defaultProps);
    const colliders: RAPIER.Collider[] = [];

    for (const part of body.parts) {
      const colliderDescs = this.createColliderDescsForPart(part, defaultProps);
      for (const desc of colliderDescs) {
        const collider = this._rapierWorld.createCollider(desc, rigidBody);
        colliders.push(collider);
        this._colliderHandleToEntityMap.set(collider.handle, entity);
      }
    }

    this._entityToRapierMap.set(entity, { rigidBody, colliders });
  }

  removeEntity(entity: Entity): void {
    const rapierObjects = this._entityToRapierMap.get(entity);
    if (rapierObjects) {
      if (!this._rapierWorld) {
        throw new Error(
          "RapierWorldManager not initialized. Call init() first.",
        );
      }
      this._rapierWorld.removeRigidBody(rapierObjects.rigidBody);
      this._entityToRapierMap.delete(entity);
      rapierObjects.colliders.forEach((collider) => {
        this._colliderHandleToEntityMap.delete(collider.handle);
      });
    }
  }

  getCollisionEvents(): CollisionEvent[] {
    if (!this._eventQueue || !this._rapierWorld) {
      throw new Error("RapierWorldManager not initialized. Call init() first.");
    }
    const events: CollisionEvent[] = [];
    this._eventQueue.drainCollisionEvents(
      (handle1: number, handle2: number, started: boolean) => {
        if (started) {
          const entity1 = this._colliderHandleToEntityMap.get(handle1);
          const entity2 = this._colliderHandleToEntityMap.get(handle2);
          if (entity1 && entity2) {
            const collider1 = this._rapierWorld!.getCollider(handle1);
            const collider2 = this._rapierWorld!.getCollider(handle2);

            if (collider1 && collider2) {
              let eventAdded = false;
              this._rapierWorld!.contactPair(
                collider1,
                collider2,
                (manifold) => {
                  if (manifold.numContacts() > 0) {
                    const p = manifold.localContactPoint1(0);
                    if (p) {
                      const rot = collider1.rotation();
                      const x = p.x * Math.cos(rot) - p.y * Math.sin(rot);
                      const y = p.x * Math.sin(rot) + p.y * Math.cos(rot);
                      const pos = new Vec2(x, y).add(
                        new Vec2(
                          collider1.translation().x,
                          collider1.translation().y,
                        ),
                      );
                      events.push({
                        entityA: entity1,
                        entityB: entity2,
                        position: pos,
                      });
                      eventAdded = true;
                    }
                  }
                },
              );

              if (!eventAdded) {
                events.push({
                  entityA: entity1,
                  entityB: entity2,
                  position: entity1.pos,
                });
              }
            } else {
              events.push({
                entityA: entity1,
                entityB: entity2,
                position: entity1.pos,
              });
            }
          }
        }
      },
    );
    return events;
  }

  private createRigidBody(
    entity: Entity,
    body: Body,
    defaultProps: DefaultCollisionProperties,
  ): RAPIER.RigidBody {
    let rigidBodyDesc: RAPIER.RigidBodyDesc;

    const isStatic = this._staticComponent.get(entity) ?? false;

    if (isStatic) {
      rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
    } else {
      switch (defaultProps.bodyType) {
        case "static":
          rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
          break;
        case "kinematicPositionBased":
          rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
          break;
        case "kinematicVelocityBased":
          rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased();
          break;
        case "dynamic":
        default:
          rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
          break;
      }
    }

    rigidBodyDesc.setTranslation(entity.pos.x, entity.pos.y);
    rigidBodyDesc.setRotation(body.rotation);

    const rigidBody = this._rapierWorld!.createRigidBody(rigidBodyDesc);

    const mass = this._physics.mass.get(entity) ?? defaultProps.mass ?? 0;
    if (mass > 0 && defaultProps.bodyType !== "static" && !isStatic) {
      const inertia = this.computeApproximateInertiaForBody(body, mass);
      rigidBody.setAdditionalMassProperties(
        mass,
        new RAPIER.Vector2(0, 0),
        inertia,
        true,
      );
    }

    return rigidBody;
  }

  private createColliderDescsForPart(
    part: BodyPart,
    defaultProps: DefaultCollisionProperties,
  ): RAPIER.ColliderDesc[] {
    const { shape, position, rotation } = part;
    const descs: RAPIER.ColliderDesc[] = [];

    const applyProps = (desc: RAPIER.ColliderDesc) => {
      desc.setDensity(0);
      desc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
      if (defaultProps.friction !== undefined)
        desc.setFriction(defaultProps.friction);
      if (defaultProps.restitution !== undefined)
        desc.setRestitution(defaultProps.restitution);
      if (defaultProps.sensor !== undefined)
        desc.setSensor(defaultProps.sensor);
      if (defaultProps.collisionGroups !== undefined)
        desc.setCollisionGroups(defaultProps.collisionGroups);
      if (defaultProps.solverGroups !== undefined)
        desc.setSolverGroups(defaultProps.solverGroups);
    };

    switch (shape.type) {
      case "circle": {
        const desc = RAPIER.ColliderDesc.ball(shape.radius);
        desc.setTranslation(position.x, position.y);
        desc.setRotation(rotation);
        applyProps(desc);
        descs.push(desc);
        break;
      }
      case "polygon": {
        const vertices = shape.vertices.flatMap((v: Vec2) => [v.x, v.y]);
        const desc = RAPIER.ColliderDesc.convexHull(new Float32Array(vertices));
        if (!desc) throw new Error("Failed to create polygon collider.");
        desc.setTranslation(position.x, position.y);
        desc.setRotation(rotation);
        applyProps(desc);
        descs.push(desc);
        break;
      }
      case "ring": {
        const segments = 16;
        const { innerRadius, outerRadius, gaps } = shape;
        if (outerRadius <= innerRadius)
          throw new Error("ring.outerRadius must be greater than innerRadius");

        const height = outerRadius - innerRadius;
        const midRadius = (outerRadius + innerRadius) / 2;
        const theta = (2 * Math.PI) / segments;
        const halfHeight = height / 2;
        const halfWidth = (midRadius * theta) / 2;

        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);

        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * 2 * Math.PI;
          const segmentAngle = angle + theta / 2;

          let inGap = false;
          for (const gap of gaps) {
            if (
              segmentAngle >= gap.startAngle &&
              segmentAngle <= gap.startAngle + gap.size
            ) {
              inGap = true;
              break;
            }
          }

          if (inGap) {
            continue;
          }

          const desc = RAPIER.ColliderDesc.cuboid(halfWidth, halfHeight);

          const segmentCenterX = midRadius * Math.cos(segmentAngle);
          const segmentCenterY = midRadius * Math.sin(segmentAngle);

          const rotatedX = segmentCenterX * cosR - segmentCenterY * sinR;
          const rotatedY = segmentCenterX * sinR + segmentCenterY * cosR;

          desc.setTranslation(position.x + rotatedX, position.y + rotatedY);
          desc.setRotation(rotation + segmentAngle + Math.PI / 2);

          applyProps(desc);
          descs.push(desc);
        }
        break;
      }
      default:
        throw new Error(`Unsupported shape type: ${(shape as any).type}`);
    }

    return descs;
  }

  syncRigidBodyToEntity(entity: Entity): void {
    const rapierObjects = this._entityToRapierMap.get(entity);
    const bodyComponent = entity.getComp(this._bodyComponent);
    if (!rapierObjects || !bodyComponent) return;

    const vel = this._physics.velocity.get(entity) || new Vec2(0, 0);

    rapierObjects.rigidBody.setTranslation(
      new RAPIER.Vector2(entity.pos.x, entity.pos.y),
      true,
    );
    rapierObjects.rigidBody.setLinvel(new RAPIER.Vector2(vel.x, vel.y), true);
    rapierObjects.rigidBody.setRotation(bodyComponent.rotation, true);
  }

  syncEntityToRigidBody(entity: Entity): void {
    const rapierObjects = this._entityToRapierMap.get(entity);
    const bodyComponent = entity.getComp(this._bodyComponent);
    if (!rapierObjects || !bodyComponent) return;

    if (rapierObjects.rigidBody.isFixed()) {
      return;
    }

    if (rapierObjects.rigidBody.isDynamic()) {
      const linvel = rapierObjects.rigidBody.linvel();
      (this._physics.velocity as Component<Vec2>).set(
        entity,
        new Vec2(linvel.x, linvel.y),
      );
    }

    const rotation = rapierObjects.rigidBody.rotation();
    bodyComponent.rotation = rotation;
  }

  getEntities(): Entity[] {
    return Array.from(this._entityToRapierMap.keys());
  }

  private computeApproximateInertiaForBody(
    body: Body,
    totalMass: number,
  ): number {
    let totalArea = 0;
    const areas: number[] = [];

    for (const part of body.parts) {
      let area = 0;
      if (part.shape.type === "circle") {
        area = Math.PI * part.shape.radius * part.shape.radius;
      } else if (part.shape.type === "polygon") {
        const verts = part.shape.vertices;
        let a = 0;
        for (let i = 0; i < verts.length; i++) {
          const j = (i + 1) % verts.length;
          a += verts[i].x * verts[j].y - verts[j].x * verts[i].y;
        }
        area = Math.abs(a) / 2;
      } else if (part.shape.type === "ring") {
        area =
          Math.PI * (part.shape.outerRadius ** 2 - part.shape.innerRadius ** 2);
        let gapArea = 0;
        for (const gap of part.shape.gaps) {
          gapArea +=
            0.5 *
            (part.shape.outerRadius ** 2 - part.shape.innerRadius ** 2) *
            gap.size;
        }
        area -= gapArea;
      }
      areas.push(area);
      totalArea += area;
    }

    if (totalArea === 0) return 0;

    let inertia = 0;

    for (let i = 0; i < body.parts.length; i++) {
      const part = body.parts[i];
      const massPart = totalMass * (areas[i] / totalArea);

      let I = 0;
      if (part.shape.type === "circle") {
        I = 0.5 * massPart * part.shape.radius * part.shape.radius;
      } else if (part.shape.type === "polygon") {
        const verts = part.shape.vertices;
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;
        for (const v of verts) {
          minX = Math.min(minX, v.x);
          maxX = Math.max(maxX, v.x);
          minY = Math.min(minY, v.y);
          maxY = Math.max(maxY, v.y);
        }
        const w = maxX - minX;
        const h = maxY - minY;
        I = (massPart * (w * w + h * h)) / 12;
      } else if (part.shape.type === "ring") {
        const R = part.shape.outerRadius;
        const r = part.shape.innerRadius;
        I = (massPart * (R * R + r * r)) / 2;
      }

      const px = part.position.x;
      const py = part.position.y;
      inertia += I + massPart * (px * px + py * py);
    }

    return inertia;
  }
}

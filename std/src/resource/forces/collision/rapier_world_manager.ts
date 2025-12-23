import * as RAPIER from '@dimforge/rapier2d-compat';

import { Vec2 } from "../../../base/vec";
import { Entity, Component } from "../../../base/entity";
import { CollisionEvent } from "./events";
import { Body, BodyPart } from "../../body/body";
import { Physics } from "../../../base/physics";

const RAPIER_FIXED_DT = 1 / 60;

export type DefaultCollisionProperties = {
  bodyType?: 'dynamic' | 'static' | 'kinematicPositionBased' | 'kinematicVelocityBased';
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
  private _entityToRapierMap: Map<Entity, { rigidBody: RAPIER.RigidBody, colliders: RAPIER.Collider[] }> = new Map();
  private _rapierHandleToEntityMap: Map<number, Entity> = new Map();
  private _physics: Physics;
  private _bodyComponent: Component<Body>;

  constructor(physics: Physics, bodyComponent: Component<Body>) {
    this._physics = physics;
    this._bodyComponent = bodyComponent;
  }

  async init(): Promise<void> {
    await RAPIER.init()
    console.log("INITIALIZED")
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
      throw new Error("Entity must have a Body component to be added to RapierWorldManager.");
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
        this._rapierHandleToEntityMap.set(collider.handle, entity);
      }
    }

    this._entityToRapierMap.set(entity, { rigidBody, colliders });
    this._rapierHandleToEntityMap.set(rigidBody.handle, entity);
  }

  removeEntity(entity: Entity): void {
    const rapierObjects = this._entityToRapierMap.get(entity);
    if (rapierObjects) {
      if (!this._rapierWorld) {
        throw new Error("RapierWorldManager not initialized. Call init() first.");
      }
      this._rapierWorld.removeRigidBody(rapierObjects.rigidBody);
      this._entityToRapierMap.delete(entity);
      this._rapierHandleToEntityMap.delete(rapierObjects.rigidBody.handle);
      rapierObjects.colliders.forEach(collider => {
        this._rapierHandleToEntityMap.delete(collider.handle);
      });
    }
  }

  getCollisionEvents(): CollisionEvent[] {
    if (!this._eventQueue) {
      throw new Error("RapierWorldManager not initialized. Call init() first.");
    }
    const events: CollisionEvent[] = [];
    this._eventQueue.drainCollisionEvents((handle1: number, handle2: number, started: boolean) => {
      if (started) {
        const entity1 = this._rapierHandleToEntityMap.get(handle1);
        const entity2 = this._rapierHandleToEntityMap.get(handle2);

        if (entity1 && entity2) {
          events.push({ entityA: entity1, entityB: entity2 });
        }
      }
    });
    return events;
  }

  private createRigidBody(entity: Entity, body: Body, defaultProps: DefaultCollisionProperties): RAPIER.RigidBody {
    let rigidBodyDesc: RAPIER.RigidBodyDesc;

    const position = entity.pos;
    const velocity = this._physics.velocity.get(entity) || new Vec2(0, 0);
    const rotation = body.rotation;

    switch (defaultProps.bodyType) {
      case 'static':
        rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
        break;
      case 'kinematicPositionBased':
        rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
        break;
      case 'kinematicVelocityBased':
        rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased();
        break;
      case 'dynamic':
      default:
        rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
        break;
    }

    rigidBodyDesc.setTranslation(position.x, position.y);
    rigidBodyDesc.setRotation(rotation);
    rigidBodyDesc.setLinvel(velocity.x, velocity.y);

    return this._rapierWorld!.createRigidBody(rigidBodyDesc);
  }

  private createColliderDescsForPart(part: BodyPart, defaultProps: DefaultCollisionProperties): RAPIER.ColliderDesc[] {
    const { shape, position, rotation } = part;
    const descs: RAPIER.ColliderDesc[] = [];

    const applyProps = (desc: RAPIER.ColliderDesc) => {
      desc.setDensity(0);
      if (defaultProps.friction !== undefined) desc.setFriction(defaultProps.friction);
      if (defaultProps.restitution !== undefined) desc.setRestitution(defaultProps.restitution);
      if (defaultProps.sensor !== undefined) desc.setSensor(defaultProps.sensor);
      if (defaultProps.collisionGroups !== undefined) desc.setCollisionGroups(defaultProps.collisionGroups);
      if (defaultProps.solverGroups !== undefined) desc.setSolverGroups(defaultProps.solverGroups);
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
        if (desc) {
          desc.setTranslation(position.x, position.y);
          desc.setRotation(rotation);
          applyProps(desc);
          descs.push(desc);
        } else {
          throw new Error("Failed to create polygon collider.");
        }
        break;
      }
      case "ring": {
        const segments = 16;
        const { innerRadius, outerRadius } = shape;

        if (outerRadius <= innerRadius) {
          throw new Error("ring.outerRadius must be greater than innerRadius");
        }

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

          const desc = RAPIER.ColliderDesc.cuboid(halfWidth, halfHeight);

          const segmentCenterX = midRadius * Math.cos(segmentAngle);
          const segmentCenterY = midRadius * Math.sin(segmentAngle);

          const rotatedSegmentCenterX = segmentCenterX * cosR - segmentCenterY * sinR;
          const rotatedSegmentCenterY = segmentCenterX * sinR + segmentCenterY * cosR;

          const finalPosX = position.x + rotatedSegmentCenterX;
          const finalPosY = position.y + rotatedSegmentCenterY;
          const finalRot = rotation + segmentAngle + Math.PI / 2;

          desc.setTranslation(finalPosX, finalPosY);
          desc.setRotation(finalRot);

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

  syncEntityToRigidBody(entity: Entity): void {
    const rapierObjects = this._entityToRapierMap.get(entity);
    const bodyComponent = entity.getComp(this._bodyComponent);

    if (rapierObjects && bodyComponent) {
      const translation = rapierObjects.rigidBody.translation();
      const linvel = rapierObjects.rigidBody.linvel();
      const rotation = rapierObjects.rigidBody.rotation();

      bodyComponent.rotation = rotation;

      const entityVelocity = this._physics.velocity.get(entity);
      if (entityVelocity) {
        (this._physics.velocity as Component<Vec2>).set(entity, new Vec2(linvel.x, linvel.y));
      } else {
        (this._physics.velocity as Component<Vec2>).set(entity, new Vec2(linvel.x, linvel.y));
      }
    }
  }

  syncRigidBodyToEntity(entity: Entity): void {
    const rapierObjects = this._entityToRapierMap.get(entity);
    const bodyComponent = entity.getComp(this._bodyComponent);

    if (rapierObjects && bodyComponent) {
      const entityVelocity = this._physics.velocity.get(entity) || new Vec2(0, 0);
      const mass = this._physics.mass.get(entity) || 0;

      rapierObjects.rigidBody.setTranslation(new RAPIER.Vector2(entity.pos.x, entity.pos.y), true);
      rapierObjects.rigidBody.setLinvel(new RAPIER.Vector2(entityVelocity.x, entityVelocity.y), true);
      rapierObjects.rigidBody.setRotation(bodyComponent.rotation, true);
      rapierObjects.rigidBody.setAdditionalMassProperties(mass, new RAPIER.Vector2(0, 0), mass, true)
    }
  }

  getEntities(): Entity[] {
    return Array.from(this._entityToRapierMap.keys());
  }
}

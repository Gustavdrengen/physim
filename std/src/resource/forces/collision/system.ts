import { Body } from '../../../feature/bodies/body.ts';
import { Entity, Component } from '../../../base/entity.ts';
import { Physics } from '../../../base/physics.ts';
import { DefaultCollisionProperties, CollisionEvent } from './types.ts';
import { WorldPort } from './world_port.ts';
import { Vec2 } from '../../../base/vec.ts';

export class CollisionSystem {
  private _worldManager: WorldPort;
  private _bodyComponent: Component<Body>;
  private _collisionEventComponent: Component<CollisionEvent[]>;
  private _defaultCollisionProperties: DefaultCollisionProperties;
  private _physics: Physics;
  private _entitiesWithCollisionEvents: Set<Entity> = new Set();
  private _collisionCallbacks: Array<(event: CollisionEvent) => void> = [];

  constructor(
    worldManager: WorldPort,
    bodyComponent: Component<Body>,
    collisionEventComponent: Component<CollisionEvent[]>,
    defaultCollisionProperties: DefaultCollisionProperties,
    physics: Physics,
  ) {
    this._worldManager = worldManager;
    this._bodyComponent = bodyComponent;
    this._collisionEventComponent = collisionEventComponent;
    this._defaultCollisionProperties = defaultCollisionProperties;
    this._physics = physics;
  }

  step(): void {
    const managedEntities = this._worldManager.getEntities();
    for (let i = managedEntities.length - 1; i >= 0; i--) {
      const managedEntity = managedEntities[i];
      if (!this._bodyComponent.has(managedEntity)) {
        this._worldManager.removeEntity(managedEntity);
      }
    }

    for (const entityWithEvents of this._entitiesWithCollisionEvents) {
      const events = this._collisionEventComponent.get(entityWithEvents);
      if (events) {
        events.length = 0;
      }
    }
    this._entitiesWithCollisionEvents.clear();

    const activeEntities = this._worldManager.getEntities();

    for (const managedEntity of activeEntities) {
      this._worldManager.syncRigidBodyToEntity(managedEntity);
    }

    this._worldManager.step();

    for (const managedEntity of activeEntities) {
      this._worldManager.syncEntityToRigidBody(managedEntity);
    }

    const newCollisionEvents = this._worldManager.getCollisionEvents();
    for (const event of newCollisionEvents) {
      let entityAEvents = this._collisionEventComponent.get(event.entityA);
      if (!entityAEvents) {
        entityAEvents = [];
        this._collisionEventComponent.set(event.entityA, entityAEvents);
      }
      entityAEvents.push(event);
      this._entitiesWithCollisionEvents.add(event.entityA);

      let entityBEvents = this._collisionEventComponent.get(event.entityB);
      if (!entityBEvents) {
        entityBEvents = [];
        this._collisionEventComponent.set(event.entityB, entityBEvents);
      }
      entityBEvents.push(event);
      this._entitiesWithCollisionEvents.add(event.entityB);

      for (const callback of this._collisionCallbacks) {
        callback(event);
      }
    }
  }

  getEntitiesWithCollisions(): Set<Entity> {
    return this._entitiesWithCollisionEvents;
  }

  addCollisionCallback(callback: (event: CollisionEvent) => void): void {
    this._collisionCallbacks.push(callback);
  }
}
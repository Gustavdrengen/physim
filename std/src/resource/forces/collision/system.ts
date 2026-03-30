import { Body } from "../../../feature/bodies/body";
import { Entity, Component } from "../../../base/entity";
import { Physics } from "../../../base/physics";
import {
  DefaultCollisionProperties,
  RapierWorldManager,
} from "./rapier_world_manager";
import { CollisionEvent } from "./events";
import { CollisionCallback } from "./mod";

export class CollisionSystem {
  private _worldManager: RapierWorldManager;
  private _bodyComponent: Component<Body>;
  private _collisionEventComponent: Component<CollisionEvent[]>;
  private _defaultCollisionProperties: DefaultCollisionProperties;
  private _physics: Physics;
  private _entitiesWithCollisionEvents: Set<Entity> = new Set();
  private _collisionCallbacks: CollisionCallback[] = [];

  constructor(
    worldManager: RapierWorldManager,
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

  /**
   * Performs the collision simulation step.
   * This should be called once per physics update, after all other forces are integrated.
   */
  // @profile "CollisionSystem.step"
  step(): void {
    // @profile-start "CollisionSystem.step.cleanup"
    const managedEntities = this._worldManager.getEntities();
    for (let i = managedEntities.length - 1; i >= 0; i--) {
      const managedEntity = managedEntities[i];
      if (!this._bodyComponent.has(managedEntity)) {
        this._worldManager.removeEntity(managedEntity);
      }
    }
    // @profile-end

    // @profile-start "CollisionSystem.step.clearEvents"
    for (const entityWithEvents of this._entitiesWithCollisionEvents) {
      const events = this._collisionEventComponent.get(entityWithEvents);
      if (events) {
        events.length = 0;
      }
    }
    this._entitiesWithCollisionEvents.clear();
    // @profile-end

    const activeEntities = this._worldManager.getEntities();

    // @profile-start "CollisionSystem.step.syncToEntity"
    for (const managedEntity of activeEntities) {
      this._worldManager.syncRigidBodyToEntity(managedEntity);
    }
    // @profile-end

    // @profile-start "CollisionSystem.step.rapierStep"
    this._worldManager.step();
    // @profile-end

    // @profile-start "CollisionSystem.step.syncToRigidBody"
    for (const managedEntity of activeEntities) {
      this._worldManager.syncEntityToRigidBody(managedEntity);
    }
    // @profile-end

    // @profile-start "CollisionSystem.step.processEvents"
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
    // @profile-end
  }

  addCollisionCallback(callback: CollisionCallback): void {
    this._collisionCallbacks.push(callback);
  }
}

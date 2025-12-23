import { Entity, Component } from "../../../base/entity";
import { Physics } from "../../../base/physics";
import { DefaultCollisionProperties, RapierWorldManager } from "./rapier_world_manager";
import { CollisionEvent } from "./events";
import { Body } from "../../body/body";

export class CollisionSystem {
  private _worldManager: RapierWorldManager;
  private _collisionEventComponent: Component<CollisionEvent[]>;
  private _defaultCollisionProperties: DefaultCollisionProperties;
  private _physics: Physics;
  private _lastUpdateFrameId: number = -1;
  private _currentFrameId: number = 0;
  private _entitiesWithCollisionEvents: Set<Entity> = new Set();

  constructor(
    worldManager: RapierWorldManager,
    collisionEventComponent: Component<CollisionEvent[]>,
    defaultCollisionProperties: DefaultCollisionProperties,
    physics: Physics
  ) {
    this._worldManager = worldManager;
    this._collisionEventComponent = collisionEventComponent;
    this._defaultCollisionProperties = defaultCollisionProperties;
    this._physics = physics;
  }

  update(entity: Entity): void {
    if (this._lastUpdateFrameId !== this._currentFrameId) {
      this._lastUpdateFrameId = this._currentFrameId;

      for (const entityWithEvents of this._entitiesWithCollisionEvents) {
        const events = this._collisionEventComponent.get(entityWithEvents);
        if (events) {
          events.length = 0;
        }
      }
      this._entitiesWithCollisionEvents.clear();

      for (const managedEntity of this._worldManager.getEntities()) {
        this._worldManager.syncRigidBodyToEntity(managedEntity);
      }

      this._worldManager.step();

      for (const managedEntity of this._worldManager.getEntities()) {
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
      }
    }
  }

  incrementFrameId(): void {
    this._currentFrameId++;
  }
}

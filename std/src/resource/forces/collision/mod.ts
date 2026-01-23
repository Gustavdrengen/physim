import { Physics } from "../../../base/physics";
import { Vec2 } from "../../../base/vec";
import { Component, Entity } from "../../../base/entity";
import { CollisionEvent } from "./events";
import {
  RapierWorldManager,
  DefaultCollisionProperties,
} from "./rapier_world_manager";
import { CollisionSystem } from "./system";
import { Body } from "../../body/body";

/**
 * A function that is called when a collision occurs.
 *
 * @param event The collision event.
 */
export type CollisionCallback = (event: CollisionEvent) => void;

/**
 * The return type of `initCollisionForce`.
 */
export type CollisionForce = {
  /**
   * Adds a callback function that will be called when a collision occurs.
   *
   * @param callback The callback function.
   */
  addCollisionCallback: (callback: CollisionCallback) => void;
};

/**
 * Initializes the collision detection and response system.
 * This function sets up the necessary components and systems to handle collisions
 * between entities with `Body` components.
 *
 * @param physics The main physics instance.
 * @param bodyComponent The component that stores the body data for entities.
 * @param defaultCollisionProperties Default properties for colliders created for entities.
 * @returns A promise that resolves to an object with a function to add a collision callback.
 */
export async function initCollisionForce(
  physics: Physics,
  bodyComponent: Component<Body>,
  defaultCollisionProperties: DefaultCollisionProperties = {}
): Promise<CollisionForce> {
  const rapierWorldManager = new RapierWorldManager(physics, bodyComponent);
  await rapierWorldManager.init();

  const collisionEventComponent = new Component<CollisionEvent[]>();

  const collisionSystem = new CollisionSystem(
    rapierWorldManager,
    collisionEventComponent,
    defaultCollisionProperties,
    physics
  );

  physics.registerForce(
    bodyComponent,
    (entity: Entity, body: Body) => {
      if (!rapierWorldManager.getEntities().includes(entity)) {
        rapierWorldManager.addEntity(entity, defaultCollisionProperties);
      }

      collisionSystem.incrementFrameId();
      collisionSystem.update(entity);
    },
    -1
  );

  return {
    addCollisionCallback: (callback: CollisionCallback) => {
      collisionSystem.addCollisionCallback(callback);
    },
  };
}

export { CollisionEvent };

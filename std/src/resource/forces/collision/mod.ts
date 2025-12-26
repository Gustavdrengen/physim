/**
 * @module
 *
 * This module provides collision detection capabilities.
 *
 * @example
 * ```ts
 * import { Entity } from "physim/ecs";
 * import { Vec2 } from "physim/vec";
 * import { createRectangle, initBodyComponent, Body } from "physim/bodies";
 * import { Physics } from "physim/physics";
 * import { initCollisionForce, CollisionEvent } from "physim/forces/collision";
 *
 * // Setup physics and components
 * const physics = new Physics();
 * const bodyComponent = initBodyComponent();
 * const collisionEventComponent = await initCollisionForce(physics, bodyComponent);
 *
 * // Create two entities with bodies
 * const entityA = new Entity(new Vec2(0, 0));
 * const bodyA = Body.fromShape(createRectangle(10, 10));
 * entityA.addComp(bodyComponent, bodyA);
 *
 * const entityB = new Entity(new Vec2(5, 0));
 * const bodyB = Body.fromShape(createRectangle(10, 10));
 * entityB.addComp(bodyComponent, bodyB);
 *
 * // Add entities to the world
 * physics.world.add(entityA);
 * physics.world.add(entityB);
 *
 * // Run the physics simulation for one step
 * physics.step(1 / 60);
 *
 * // Check for collision events
 * const eventsA = entityA.get(collisionEventComponent);
 * if (eventsA) {
 *   for (const event of eventsA) {
 *     console.log(`Entity A collided with Entity ${event.entityB.id}`);
 *   }
 * }
 *
 * const eventsB = entityB.get(collisionEventComponent);
 * if (eventsB) {
 *   for (const event of eventsB) {
 *     console.log(`Entity B collided with Entity ${event.entityA.id}`);
 *   }
 * }
 * ```
 */
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
 * Initializes the collision detection and response system.
 * This function sets up the necessary components and systems to handle collisions
 * between entities with `Body` components.
 *
 * @param physics The main physics instance.
 * @param bodyComponent The component that stores the body data for entities.
 * @param defaultCollisionProperties Default properties for colliders created for entities.
 * @returns A promise that resolves to a component containing an array of `CollisionEvent`s for each frame.
 */
export async function initCollisionForce(
  physics: Physics,
  bodyComponent: Component<Body>,
  defaultCollisionProperties: DefaultCollisionProperties = {}
): Promise<Component<CollisionEvent[]>> {
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

  return collisionEventComponent;
}

export { CollisionEvent };

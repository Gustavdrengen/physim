import { Physics } from "../../../base/physics.ts";
import { Vec2 } from "../../../base/vec.ts";
import { Component, Entity } from "../../../base/entity.ts";
import { CollisionEvent } from "./types.ts";
import {
  PlanckWorldManager,
  DefaultCollisionProperties,
} from "./planck_world.ts";
import { CollisionSystem } from "./system.ts";
import { Body } from "../../../feature/bodies/body.ts";

/**
 * Callback function invoked when a collision occurs between two entities.
 *
 * @param event - The collision event containing information about the collision.
 *
 * @example
 * ```ts
 * addCollisionCallback((event) => {
 *   // Create visual effect at collision point
 *   particles.emit(createSparkEffect({ position: event.position }));
 *
 *   // Play sound
 *   collisionSound.play();
 *
 *   // Shake camera
 *   camera.shake(20, 10);
 * });
 * ```
 */
export type CollisionCallback = (event: CollisionEvent) => void;

/**
 * The collision force interface returned by `initCollisionForce`.
 * Provides methods and components for managing collision behavior.
 */
export type CollisionForce = {
  /**
   * Registers a callback that is invoked whenever a collision occurs.
   * Use this to trigger visual effects, sounds, game logic, etc.
   *
   * @param callback - Function called with the CollisionEvent on each collision.
   *
   * @example
   * ```ts
   * const { addCollisionCallback } = await initCollisionForce(...);
   *
   * addCollisionCallback((event) => {
   *   log('Bodies collided at', event.position.x, event.position.y);
   * });
   * ```
   */
  addCollisionCallback: (callback: CollisionCallback) => void;

  /**
   * A component to mark entities as static (immovable) in collisions.
   * Static entities do not move when collided with and cannot have nonzero velocity.
   * with other static or kinematic bodies.
   *
   * Add this component with value `true` to make an entity static.
   *
   * @example
   * ```ts
   * Entity.create(position, [
   *   [bodyComponent, someBody],
   *   [staticComponent, true] // This entity is static
   * ]);
   * ```
   */
  staticComponent: Component<boolean>;

  /**
   * A component to set per-entity restitution (bounciness) values.
   * If not set on an entity, the default from `initCollisionForce` is used.
   *
   * @example
   * ```ts
   * // High bounce
   * Entity.create(position, [
   *   [bodyComponent, ballBody],
   *   [restitutionComponent, 0.95] // Very bouncy
   * ]);
   *
   * // Low bounce
   * Entity.create(position, [
   *   [bodyComponent, rockBody],
   *   [restitutionComponent, 0.1] // Barely bounces
   * ]);
   * ```
   */
  restitutionComponent: Component<number>;
};

/**
 * Initializes the collision force for a physics simulation.
 *
 * This function sets up collision detection and response using Planck.js
 * (a port of Box2D).
 *
 * IMPORTANT: When this force is active, it takes over the position and
 * rotation updates for all entities that have a `Body` component. The
 * standard `Physics` position integration (priority 2) is effectively
 * bypassed for these entities to ensure they follow the rigid body
 * simulation constraints.
 *
 * @param physics - The physics system instance.
 * @param bodyComponent - The body component obtained from `initBodyComponent`.
 * @param defaultCollisionProperties - Default physical properties for all collision bodies.
 *
 * @returns Promise resolving to a CollisionForce object with collision management tools.
 *
 * @example
 * ```ts
 * import { Simulation, Entity, Vec2 } from 'physim/base';
 * import { initCollisionForce } from 'physim/forces/collision';
 * import { initBodyComponent, Body, createCircle } from 'physim/bodies';
 * import { log } from 'physim/logging';
 *
 * const sim = new Simulation();
 * const bodyComp = initBodyComponent(sim.physics);
 *
 * const { staticComponent, addCollisionCallback, restitutionComponent } =
 *   await initCollisionForce(sim.physics, bodyComp, {
 *     restitution: 0.8,
 *     friction: 0.5,
 *     mass: 1.0
 *   });
 *
 * // Add collision callback for effects
 * addCollisionCallback((event) => {
 *   log('Collision at', event.position);
 * });
 *
 * // Create a static wall
 * const wall = Entity.create(new Vec2(100, 50), [
 *   [bodyComp, Body.fromShape(createRectangle(20, 200))],
 *   [staticComponent, true]
 * ]);
 *
 * // Create a bouncy ball
 * const ball = Entity.create(new Vec2(50, 50), [
 *   [bodyComp, Body.fromShape(createCircle(20))],
 *   [restitutionComponent, 0.95], // Override default restitution
 *   [sim.physics.velocity, new Vec2(100, 0)]
 * ]);
 * ```
 */
export async function initCollisionForce(
  physics: Physics,
  bodyComponent: Component<Body>,
  defaultCollisionProperties: DefaultCollisionProperties = {},
): Promise<CollisionForce> {
  const staticComponent = new Component<boolean>();
  const restitutionComponent = new Component<number>();

  const worldManager = new PlanckWorldManager(
    physics,
    bodyComponent,
    staticComponent,
    restitutionComponent,
  );
  await worldManager.init();

  const collisionEventComponent = new Component<CollisionEvent[]>();

  const collisionSystem = new CollisionSystem(
    worldManager,
    bodyComponent,
    collisionEventComponent,
    defaultCollisionProperties,
    physics,
  );

  const originalVelocities = new Map<Entity, Vec2>();
  const collidedEntities = new Set<Entity>();

  physics.registerForce(
    bodyComponent,
    (entity: Entity) => {
      if (collidedEntities.has(entity)) {
        return;
      }
      const vel = physics.velocity.get(entity);
      if (vel) {
        originalVelocities.set(entity, vel.clone());
        physics.velocity.set(entity, new Vec2(0, 0));
      }
    },
    1.5,
  );

  physics.registerForce(
    bodyComponent,
    (entity: Entity) => {
      if (collidedEntities.has(entity)) {
        collidedEntities.delete(entity);
        originalVelocities.delete(entity);
        return;
      }
      const originalVel = originalVelocities.get(entity);
      if (originalVel) {
        physics.velocity.set(entity, originalVel);
        originalVelocities.delete(entity);
      }
    },
    2.5,
  );

  physics.registerForce(
    bodyComponent,
    (entity: Entity, _body: Body) => {
      if (!worldManager.hasEntity(entity)) {
        worldManager.addEntity(entity, _body, defaultCollisionProperties);
      }
    },
    4,
  );

  physics.registerStaticForce(() => {
    collisionSystem.step();
    for (const entity of collisionSystem.getEntitiesWithCollisions()) {
      collidedEntities.add(entity);
    }
  }, 5);

  return {
    addCollisionCallback: (callback: CollisionCallback) => {
      collisionSystem.addCollisionCallback(callback);
    },
    staticComponent,
    restitutionComponent,
  };
}

export { CollisionEvent, DefaultCollisionProperties };

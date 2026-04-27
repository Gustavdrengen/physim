import { Entity } from "../../../base/entity.ts";
import { Vec2 } from "../../../base/vec.ts";

/**
 * Represents a collision event between two entities.
 * Dispatched to collision callbacks when a collision is detected.
 *
 * @example
 * ```ts
 * addCollisionCallback((event) => {
 *   log('Collision between', event.entityA, 'and', event.entityB);
 *   log('Position:', event.position.x, event.position.y);
 * });
 * ```
 */
export interface CollisionEvent {
  /** The first entity involved in the collision. */
  entityA: Entity;

  /** The second entity involved in the collision. */
  entityB: Entity;

  /** The world position where the collision occurred. */
  position: Vec2;
}

/**
 * Default physical properties for collision bodies.
 * These values are applied to all entities unless overridden per-entity.
 */
export type DefaultCollisionProperties = {
  /**
   * The mass of the body in kilograms.
   * Higher mass means more resistance to movement and more momentum in collisions.
   * @default 1.0
   */
  mass?: number;

  /**
   * Friction coefficient (0-1).
   * Controls how much objects slide along each other upon collision.
   * 0 = frictionless, 1 = maximum friction.
   * @default 0.5
   */
  friction?: number;

  /**
   * Restitution coefficient (0-1).
   * Controls how bouncy collisions are.
   * 0 = no bounce (inelastic), 1 = perfect bounce (elastic).
   * @default 1.0
   */
  restitution?: number;

  /**
   * If true, the body detects collisions but does not produce physical response.
   * Useful for trigger zones, sensors, or detection areas.
   * @default false
   */
  sensor?: boolean;
};

/**
 * @internal
 */
export interface SyncedState {
  pos: Vec2;
  rotation: number;
  velocity: Vec2;
  angularVelocity: number;
}

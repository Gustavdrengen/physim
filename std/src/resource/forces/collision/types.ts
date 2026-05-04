import { Entity } from "../../../base/entity.ts";
import { Vec2 } from "../../../base/vec.ts";

/**
 * Represents a collision event between two entities.
 * Dispatched to collision callbacks when a collision is detected.
 *
 * @example
 * ```ts
 * import { impactFactor } from "physim/forces/collision";
 * import { createSparkEffect } from "physim/effects/particles";
 *
 * addCollisionCallback((event) => {
 *   // Scale effects based on collision intensity
 *   const f = impactFactor(event.impactSpeed);
 *
 *   // Camera shake proportional to impact
 *   simulation.camera.shake(f * 60, f * 20);
 *
 *   // Particle burst scaled to collision strength
 *   particleSystem.emit(createSparkEffect({
 *     position: event.position,
 *     intensity: f,
 *   }));
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

  /**
   * The relative velocity of the two bodies at the contact point,
   * in simulation units per second.
   */
  relativeVelocity: Vec2;

  /**
   * The magnitude of the relative velocity along the collision normal,
   * in simulation units per second. This is the key scalar for scaling
   * effects like camera shake, particle count, and sound volume.
   */
  impactSpeed: number;

  /**
   * The collision normal in world space, pointing from entityA toward entityB.
   */
  normal: Vec2;
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

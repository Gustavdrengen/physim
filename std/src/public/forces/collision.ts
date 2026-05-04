/**
 * Collision detection and response.
 *
 * This module provides collision force for the physics engine, enabling:
 * - Collision detection between entities with bodies
 * - Physical response (bouncing, friction) via restitution
 * - Collision callbacks with impact speed data for scaling effects
 * - Static vs dynamic body distinction
 * - Per-entity restitution override
 *
 * @module
 * @example
 * ```ts
 * import { Simulation, Entity, Vec2, Color, ParticleSystem } from 'physim/base';
 * import { initCollisionForce, impactFactor } from 'physim/forces/collision';
 * import { initBodyComponent, Body, createCircle, createRectangle } from 'physim/bodies';
 * import { createSparkEffect } from 'physim/effects/particles';
 *
 * const simulation = new Simulation();
 * const bodyComponent = initBodyComponent(simulation.physics);
 * const particles = new ParticleSystem(simulation.display);
 *
 * // Initialize collision with default restitution of 0.8 (bouncy)
 * const { staticComponent, restitutionComponent, addCollisionCallback } =
 *   await initCollisionForce(simulation.physics, bodyComponent, {
 *     restitution: 0.8,
 *     friction: 0.3
 *   });
 *
 * // Register collision callback with intensity-based effects
 * addCollisionCallback((event) => {
 *   // Scale effects based on collision strength
 *   const f = impactFactor(event.impactSpeed);
 *
 *   // Particle burst at collision point
 *   particles.emit(createSparkEffect({
 *     position: event.position,
 *     intensity: f,
 *   }));
 *
 *   // Camera shake proportional to impact
 *   simulation.camera.shake(f * 60, f * 20);
 * });
 *
 * // Create a static wall
 * Entity.create(new Vec2(100, 300), [
 *   [bodyComponent, Body.fromShape(createRectangle(20, 400))],
 *   [staticComponent, true]
 * ]);
 *
 * // Create a dynamic ball with default restitution
 * Entity.create(new Vec2(50, 300), [
 *   [bodyComponent, Body.fromShape(createCircle(20))],
 *   [simulation.physics.velocity, new Vec2(200, 0)]
 * ]);
 *
 * // Create a highly bouncy ball (overrides default restitution)
 * Entity.create(new Vec2(50, 400), [
 *   [bodyComponent, Body.fromShape(createCircle(15))],
 *   [restitutionComponent, 0.95] // Very bouncy
 * ]);
 * ```
 */
export * from '../../resource/forces/collision/mod.ts';
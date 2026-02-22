/**
 * This module provides a collision force for the physics engine.
 *
 * @module
 * @example
 * ```ts
 * import { Simulation } from "physim/simulation";
 * import { initCollisionForce } from "physim/forces/collision";
 * import { initBodyComponent, Body } from "physim/bodies";
 * import { Entity } from "physim/ecs";
 * import { Vec2 } from "physim/vec";
 *
 * const simulation = new Simulation();
 * const bodyComponent = initBodyComponent();
 *
 * const { staticComponent } = await initCollisionForce(simulation.physics, bodyComponent, {
 *  restitution: 0.1
 * });
 *
 * // Create a dynamic entity
 * const dynamicBody = Body.fromShape({ type: "circle", radius: 10 });
 * const dynamicEntity = Entity.create(
 *   new Vec2(50, 50),
 *   [[bodyComponent, dynamicBody]]
 * );
 * simulation.physics.velocity.set(dynamicEntity, new Vec2(10, 0));
 *
 * // Create a static entity
 * const staticBody = Body.fromShape({ type: "circle", radius: 20 });
 * const staticEntity = Entity.create(
 *   new Vec2(100, 50),
 *   [
 *     [bodyComponent, staticBody],
 *     [staticComponent, true] // Mark this entity as static
 *   ]
 * );
 * ```
 */
export * from "../../resource/forces/collision/mod.ts";
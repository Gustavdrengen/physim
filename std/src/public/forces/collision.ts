/**
 * This module provides a collision force for the physics engine.
 *
 * @module
 * @example
 * ```ts
 * import { Simulation } from "physim/simulation";
 * import { initCollisionForce } from "physim/forces/collision";
 * import { initBodyComponent } from "physim/bodies";
 *
 * const simulation = new Simulation();
 * const bodyComponent = initBodyComponent();
 *
 * await initCollisionForce(simulation.physics, bodyComponent, {
 *  restitution: 0.1
 * });
 * ```
 */
export * from "../../resource/forces/collision/mod.ts";
/**
 * This module provides a gravity force for the physics engine.
 *
 * @module
 * @example
 * ```ts
 * import { Simulation } from "physim/simulation";
 * import { initGravityForce } from "physim/forces/gravity";
 *
 * const simulation = new Simulation();
 * initGravityForce(simulation.physics, 9.8);
 * ```
 */
export * from "../../resource/forces/gravity.ts";
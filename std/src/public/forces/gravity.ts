/**
 * This module provides an attraction-based gravity force for the physics engine.
 *
 * @module
 * @example
 * ```ts
 * import { Simulation } from "physim/base";
 * import { initGravityForce } from "physim/forces/gravity";
 *
 * const simulation = new Simulation();
 * initGravityForce(simulation.physics, 9.8);
 * ```
 */
export * from "../../resource/forces/gravity.ts";

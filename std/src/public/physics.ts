/**
 * This module contains the Physics class.
 *
 * @example
 * ```ts
 * import { Simulation } from "physim/simulation";
 * import { Entity } from "physim/ecs";
 * import { Vec2 } from "physim/vec";
 *
 * const simulation = new Simulation();
 *
 * // Create an entity with a velocity component.
 * const player = Entity.create(
 *   new Vec2(0, 0),
 *   [[simulation.physics.velocity, new Vec2(1, 0)]]
 * );
 *
 * // Run the simulation. The player will move by (1, 0) every frame.
 * simulation.run();
 * ```
 *
 * @module
 */

export * from "../base/physics.ts";

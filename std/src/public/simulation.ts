/**
 * @module simulation
 *
 * The simulation module provides the `Simulation` class, which is the main entry point for creating and managing a simulation.
 * It integrates physics and rendering to create a dynamic world.
 *
 * @example
 * ```ts
 * import { Simulation } from "physim/simulation";
 * import { Entity } from "physim/ecs";
 * import { Vec2 } from "physim/vec";
 * import { createRectangle, initBodyComponent, Body } from "physim/bodies";
 * import { initBodyDisplayComponent } from "physim/graphics";
 *
 * // Create a new simulation.
 * const simulation = new Simulation();
 *
 * const bodyComponent = initBodyComponent();
 * initBodyDisplayComponent(simulation.display);
 *
 * const body = Body.fromShape(createRectangle(50, 50));
 *
 * const box = Entity.create(
 *   new Vec2(100, 100),
 *   [
 *     [bodyComponent, body],
 *     [simulation.physics.velocity, new Vec2(0, 50)]
 *   ]
 * );
 *
 * // Start the simulation.
 * simulation.run();
 * ```
 */
export * from "../base/simulation";

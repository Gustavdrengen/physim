/**
 *
 * A system for creating and managing particles.
 *
 * @example
 * ```ts
 * import { ParticleSystem } from "physim/particles";
 * import { Vec2, Color, Simulation } from "physim/base";
 *
 * const simulation = new Simulation();
 *
 * const particleSystem = new ParticleSystem(simulation.display);
 *
 * // Emit some particles at the start
 * particleSystem.emit({
 *   numParticles: 100,
 *   position: new Vec2(0, 0),
 *   particleLifetime: { min: 0.5, max: 1.0 },
 *   initialVelocity: { min: 20, max: 800 },
 *   scale: 5,
 *   color: { start: Color.fromHex("#ff0000"), end: Color.fromHex("#ffff00") },
 * });
 *
 * await simulation.run();
 * ```
 * @module
 */

export * from "../feature/particles/system.ts";
export * from "../feature/particles/particle.ts";

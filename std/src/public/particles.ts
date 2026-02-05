/**
 *
 * A system for creating and managing particles.
 *
 * @example
 * ```ts
 * import { ParticleSystem } from "physim/particles";
 * import { Vec2 } from "physim/vec";
 * import { Color } from "physim/draw";
 *
 * const particleSystem = new ParticleSystem();
 *
 * // Emit some particles at the start
 * particleSystem.emit({
 *   numParticles: 100,
 *   position: new Vec2(0, 0),
 *   particleLifetime: { min: 30, max: 60 },
 *   initialVelocity: { min: new Vec2(-2, -2), max: new Vec2(2, 2) },
 *   size: 5, // Constant size
 *   color: { start: Color.fromHex("#ff0000"), end: Color.fromHex("#ffff00") },
 * });
 *
 * sim.onUpdate = () => {
 *   particleSystem.updateAndRender();
 * }
 * ```
 * @module
 */

export * from "../base/particles/system";
export * from "../base/particles/particle";

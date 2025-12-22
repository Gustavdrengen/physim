/**
 * This module contains the Physics class.
 *
 * @example
 * ```ts
 * import { Physics } from "physim/physics";
 * import { Entity } from "physim/ecs";
 * import { Vec2 } from "physim/vec";
 *
 * const physics = new Physics();
 *
 * const player = new Entity(new Vec2(0, 0));
 * player.addComp(physics.velocity, new Vec2(1, 0));
 *
 * sim.onUpdate = () => {
 *   physics.update();
 *   // player.pos is now (1, 0)
 * }
 * ```
 *
 * @module
 */

export * from "../base/physics.ts";

/**
 * This module contains forces that can be applied to entities.
 *
 * @example
 * ```ts
 * import { Physics } from "physim/physics";
 * import { initGravityForce } from "physim/forces";
 *
 * const physics = new Physics();
 * initGravityForce(physics, 0.1);
 * ```
 *
 * @module
 */

export * from "../resource/forces/gravity.ts";

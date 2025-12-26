/**
 * This module provides a collision force for the physics engine.
 *
 * @module
 * @example
 * ```ts
 * import { initCollisionForce } from "physim/forces/collision";
 * import { Physics } from "physim/physics";
 * import { initBodyComponent } from "physim/bodies";
 *
 * const physics = new Physics();
 * const bodyComponent = initBodyComponent();
 *
 * await initCollisionForce(physics, bodyComponent, {
 *  restitution: 0.1
 * });
 * ```
 */
export * from "../../resource/forces/collision/mod.ts";
/**
 * This module contains classes and functions for creating physical bodies.
 *
 * @example
 * ```ts
 * import { Entity } from "physim/ecs";
 * import { Vec2 } from "physim/vec";
 * import { createRectangle, initBodyComponent, Body } from "physim/bodies";
 *
 * const bodyComponent = initBodyComponent();
 *
 * const bodyData = new Body([{
 *   shape: createRectangle(10, 10),
 *   position: Vec2.zero(),
 *   rotation: 0
 * }]);
 *
 * const entity = new Entity(new Vec2(100, 100));
 * entity.addComp(bodyComponent, bodyData);
 * ```
 *
 * @module
 */

export * from "../resource/body/body.ts";
export * from "../resource/body/shape.ts";

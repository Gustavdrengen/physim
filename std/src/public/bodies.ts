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
 * const bodyDisplay = initBodyDisplayComponent(
 *  simulation.display,
 *  bodyComponent,
 * );
 *
 *
 * const body = Body.fromShape(createRectangle(10, 10));
 *
 * const entity = Entity.create(
 *  new Vec2(100, 100),
 *  [
 *   [bodyComponent, body],
 *   [bodyDisplay, { color: Color.fromRGB(0, 0, 255), fill: true }]
 *  ]
 * );
 * ```
 *
 * @module
 */

export * from "../resource/body/body.ts";
export * from "../resource/body/shape.ts";

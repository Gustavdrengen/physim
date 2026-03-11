/**
 * This module contains classes and functions for creating physical bodies.
 *
 * @example
 * ```ts
 * import { Entity, Vec2, Color } from "physim/base";
 * import { createRectangle, initBodyComponent, Body } from "physim/bodies";
 * import { initBodyDisplayComponent } from "physim/graphics";
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

export * from "../feature/bodies/body.ts";
export * from "../feature/bodies/shape.ts";

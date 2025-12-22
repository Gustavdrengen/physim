/**
 * This module contains the Display and Camera classes.
 *
 * @example
 * ```ts
 * import { Display, Camera } from "physim/display";
 * import { Component, Entity } from "physim/ecs";
 * import { Vec2 } from "physim/vec";
 *
 * const display = new Display();
 * const camera = new Camera();
 *
 * const position = new Component<Vec2>();
 *
 * display.registerDrawComponent(position, (entity, data) => {
 *   // Draw the entity
 * });
 *
 * sim.onUpdate = () => {
 *   display.draw(camera);
 * }
 * ```
 *
 * @module
 */

export * from "../base/display.ts";
export * from "../base/camera.ts";

/**
 * This module contains drawing functions and classes.
 *
 * @example
 * ```ts
 * import { circle, clear } from "physim/draw";
 * import { Vec2 } from "physim/vec";
 *
 * clear();
 * circle(new Vec2(100, 100), 50, "red");
 * ```
 *
 * @module
 */

export * from "../base/draw/color.ts";
export * from "../base/draw/shapes.ts";
export * from "../base/draw/text.ts";

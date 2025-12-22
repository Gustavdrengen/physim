/**
 * This module contains the Entity and Component classes.
 *
 * @example
 * ```ts
 * import { Entity, Component } from "physim/ecs";
 * import { Vec2 } from "physim/vec";
 * import { log } from "physim/logging";
 *
 * const position = new Component<Vec2>();
 * const health = new Component<number>();
 *
 * const player = new Entity(new Vec2(0, 0));
 * player.addComp(position, new Vec2(10, 20));
 * player.addComp(health, 100);
 *
 * log(player.getComp(position)); // Vec2 { x: 10, y: 20 }
 * ```
 *
 * @module
 */

export * from "../base/entity.ts";

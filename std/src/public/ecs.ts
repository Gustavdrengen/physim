/**
 * This module provides the core Entity-Component-System (ECS) architecture.
 *
 * @example
 * ```ts
 * import { Entity, Component } from "physim/ecs";
 * import { Vec2 } from "physim/vec"; // Vec2 is needed for Entity.create's position
 * import { log } from "physim/logging";
 *
 * // Define abstract components
 * const nameComponent = new Component<string>();
 * const valueComponent = new Component<number>();
 *
 * // Create an entity with initial components
 * const item = Entity.create(
 *   // Entities always have a position, even if not directly used in this example
 *   new Vec2(0, 0),
 *   [
 *     [nameComponent, "Abstract Item"],
 *     [valueComponent, 42]
 *   ]
 * );
 *
 * // Access components
 * log(`Item Name: ${item.getComp(nameComponent)}`); // Item Name: Abstract Item
 * log(`Item Value: ${item.getComp(valueComponent)}`); // Item Value: 42
 *
 * // Remove a component
 * item.removeComp(valueComponent);
 * log(`Item Value after removal: ${item.getComp(valueComponent)}`); // Item Value after removal: undefined
 * ```
 *
 * @module
 */
export * from "../base/entity.ts";

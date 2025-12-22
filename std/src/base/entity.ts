import { Vec2 } from "./vec.ts";

/**
 * An entity in the world.
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
 */
export class Entity {
  /**
   * The position of the entity.
   */
  pos: Vec2;

  /**
   * Creates a new entity.
   *
   * @param pos The initial position of the entity.
   */
  constructor(pos: Vec2) {
    this.pos = pos;
  }

  /**
   * Adds a component to the entity.
   *
   * @param component The component to add.
   * @param value The value of the component.
   */
  addComp<T>(component: Component<T>, value: T): void {
    component.set(this, value);
  }

  /**
   * Gets a component from the entity.
   *
   * @param component The component to get.
   * @returns The value of the component, or undefined if the entity does not have the component.
   */
  getComp<T>(component: Component<T>): T | undefined {
    return component.get(this);
  }

  /**
   * Removes a component from the entity.
   *
   * @param component The component to remove.
   */
  removeComp<T>(component: Component<T>): void {
    component.delete(this);
  }
}

/**
 * A component that can be attached to an entity.
 * It is a map from entities to component values.
 *
 * @see {@link Entity}
 */
export class Component<T> extends Map<Entity, T> {
}

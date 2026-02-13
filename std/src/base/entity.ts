import { Vec2 } from "./vec.ts";

/**
 * An entity in the world.
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
   * Creates a new entity with the given components.
   *
   * @param pos The initial position of the entity.
   * @param components An array of component-value pairs to add to the entity.
   * @returns The new entity.
   */
  static create(
    pos: Vec2,
    components: [Component<any>, any][],
  ): Entity {
    const entity = new Entity(pos);
    for (const [component, value] of components) {
      entity.addComp(component, value);
    }
    return entity;
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

import { Component, Entity } from "./entity.ts";
import { Vec2 } from "./vec.ts";

/**
 * The `Physics` class is responsible for updating entities based on forces.
 *
 * @example
 * ```ts
 * import { Physics, Entity, Vec2 } from "physim";
 *
 * const physics = new Physics();
 *
 * const player = new Entity(new Vec2(0, 0));
 * player.addComp(physics.velocity, new Vec2(1, 0));
 *
 * sim.onUpdate = () => {
 *   physics.update();
 *   // player.pos is now (1, 0)
 * }
 * ```
 */
export class Physics {
  private forces: Array<
    [comps: Component<any>[] | Component<any>, (entity: Entity, data: any) => void]
  > = [];

  /**
   * The velocity component.
   * If an entity has this component, it will be moved by its velocity every frame.
   */
  velocity: Component<Vec2> = new Component<Vec2>();
  /**
   * The acceleration component.
   * This component is used to accumulate forces on an entity.
   */
  acceleration: Component<Vec2> = new Component<Vec2>();
  /**
   * The mass component.
   * This component is used to store the mass of an entity.
   */
  mass: Component<number> = new Component<number>();

  /**
   * Creates a new `Physics` instance.
   */
  constructor() {
    this.registerForce(this.acceleration, (entity: Entity, acc: Vec2) => {
      const vel = this.velocity.get(entity) || new Vec2(0, 0);
      this.velocity.set(entity, vel.add(acc));
      this.acceleration.set(entity, new Vec2(0, 0));
    });

    this.registerForce(this.velocity, (entity: Entity, vel: Vec2) => {
      entity.pos = entity.pos.add(vel);
    });
  }

  /**
   * Registers a force to be applied to entities.
   *
   * @param comps The component or array of components that the force is associated with.
   * @param force The function that applies the force.
   */
  registerForce<T extends any[]>(
    comps: Component<T[number]>[],
    force: (entity: Entity, data: T) => void,
  ): void;
  registerForce<T>(
    comp: Component<T>,
    force: (entity: Entity, data: T) => void,
  ): void;
  registerForce<T>(
    comps: Component<T>[] | Component<T>,
    force: (entity: Entity, data: T | T[]) => void,
  ) {
    this.forces.push([comps, force]);
  }

  /**
   * Updates the position of all entities based on the registered forces.
   */
  update() {
    for (const [comps, forceFunc] of this.forces) {
      const componentsArray = Array.isArray(comps) ? comps : [comps];

      // Find entities that have all required components
      let entitiesWithAllComps: Set<Entity> | undefined;

      for (const comp of componentsArray) {
        if (!entitiesWithAllComps) {
          entitiesWithAllComps = new Set(comp.keys());
        } else {
          entitiesWithAllComps = new Set([...entitiesWithAllComps].filter(entity => comp.has(entity)));
        }
      }

      if (entitiesWithAllComps) {
        for (const entity of entitiesWithAllComps) {
          const data = componentsArray.length === 1
            ? componentsArray[0].get(entity)
            : componentsArray.map(c => c.get(entity));
          forceFunc(entity, data);
        }
      }
    }
  }
}

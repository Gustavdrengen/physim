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
    [comp: Component<any>, (entity: Entity, data: any) => void]
  > = [];

  /**
   * The velocity component.
   * If an entity has this component, it will be moved by its velocity every frame.
   */
  velocity: Component<Vec2> = new Component<Vec2>();

  /**
   * Creates a new `Physics` instance.
   */
  constructor() {
    this.registerForce(this.velocity, (entity: Entity, vel: Vec2) => {
      entity.pos = entity.pos.add(vel);
    });
  }

  /**
   * Registers a force to be applied to entities.
   *
   * @param comp The component that the force is associated with.
   * @param force The function that applies the force.
   */
  registerForce<T>(
    comp: Component<T>,
    force: (entity: Entity, data: T) => void,
  ) {
    this.forces.push([comp, force]);
  }

  /**
   * Updates the position of all entities based on the registered forces.
   */
  update() {
    for (const force of this.forces) {
      for (const entity of force[0].keys()) {
        force[1](entity, force[0].get(entity));
      }
    }
  }
}

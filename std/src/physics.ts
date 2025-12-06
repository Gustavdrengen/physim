import { Component, Entity } from "./entity.ts";
import { log } from "./logging/mod.ts";
import { Vec2 } from "./vec.ts";

export class Physics {
  forces: Array<[comp: Component<any>, (entity: Entity, data: any) => void]> = [];

  velocity: Component<Vec2> = new Component<Vec2>();

  constructor() {
    this.registerForce(this.velocity, (entity: Entity, vel: Vec2) => {
      entity.pos = entity.pos.add(vel);
    });
  }

  registerForce<T>(comp: Component<T>, force: (entity: Entity, data: T) => void) {
    this.forces.push([comp, force]);
  }

  update() {
    for (const force of this.forces) {
      for (const entity of force[0].keys()) {
        force[1](entity, force[0].get(entity));
      }
    }
  }
}

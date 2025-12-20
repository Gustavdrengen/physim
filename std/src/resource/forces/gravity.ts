import { Physics } from "../../base/physics.ts";
import { Vec2 } from "../../base/vec.ts";
import { Entity } from "../../base/entity.ts";

/**
 * Initializes the gravitational force for the physics engine.
 * This function creates and registers a force that simulates mutual gravitational
 * attraction between all entities that have a `mass` component.
 *
 * @param physics The physics engine instance.
 * @param G The gravitational constant.
 */
export function initGravityForce(physics: Physics, G: number): void {
  const gravityForce = (entity: Entity, mass: number) => {
    for (const otherEntity of physics.mass.keys()) {
      if (entity === otherEntity) continue;

      const otherMass = physics.mass.get(otherEntity);
      if (otherMass === undefined) continue;

      const d = otherEntity.pos.sub(entity.pos);
      const distSq = d.dot(d);

      if (distSq === 0) continue;

      const forceMag = G * (mass * otherMass) / distSq;
      const forceVec = d.normalize().scale(forceMag);

      const currentAcc = physics.acceleration.get(entity) || new Vec2(0, 0);
      physics.acceleration.set(
        entity,
        currentAcc.add(forceVec.scale(1 / mass)),
      );
    }
  };

  physics.registerForce(physics.mass, gravityForce);
}

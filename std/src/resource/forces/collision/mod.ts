import { Physics } from "../../../base/physics";
import { Vec2 } from "../../../base/vec";
import { Component, Entity } from "../../../base/entity";
import { CollisionEvent } from "./events";
import { RapierWorldManager, DefaultCollisionProperties } from "./rapier_world_manager";
import { CollisionSystem } from "./system";
import { Body } from "../../body/body";

export async function initCollisionForce(
  physics: Physics,
  bodyComponent: Component<Body>,
  defaultCollisionProperties: DefaultCollisionProperties = {}
): Promise<Component<CollisionEvent[]>> {
  const rapierWorldManager = new RapierWorldManager(physics, bodyComponent);
  await rapierWorldManager.init();

  const collisionEventComponent = new Component<CollisionEvent[]>();

  const collisionSystem = new CollisionSystem(
    rapierWorldManager,
    collisionEventComponent,
    defaultCollisionProperties,
    physics
  );

  physics.registerForce(bodyComponent, (entity: Entity, body: Body) => {
    if (!rapierWorldManager.getEntities().includes(entity)) {
      rapierWorldManager.addEntity(entity, defaultCollisionProperties);
    }

    collisionSystem.incrementFrameId();
    collisionSystem.update(entity);
  }, -1);

  return collisionEventComponent;
}

export { CollisionEvent };

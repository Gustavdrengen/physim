import { testAsync, expect, finish } from "../../test.ts";
import { initCollisionForce } from "physim/forces/collision";
import { Physics } from "physim/physics";
import { Entity } from "physim/ecs";
import { Vec2 } from "physim/vec";
import { initBodyComponent, Body, createCircle } from "physim/bodies";

testAsync("initCollisionForce - collision callback", async () => {
  const physics = new Physics();
  const bodyComponent = initBodyComponent();
  const collisionForce = await initCollisionForce(physics, bodyComponent);

  const entity1 = new Entity(new Vec2(0, 0));
  const body1 = Body.fromShape(createCircle(10));
  entity1.addComp(bodyComponent, body1);
  entity1.addComp(physics.velocity, new Vec2(1, 0));

  const entity2 = new Entity(new Vec2(15, 0));
  const body2 = Body.fromShape(createCircle(10));
  entity2.addComp(bodyComponent, body2);
  entity2.addComp(physics.velocity, new Vec2(-1, 0));

  let collisionHappened = false;
  let receivedEvent: any = null;

  collisionForce.addCollisionCallback((event) => {
    collisionHappened = true;
    receivedEvent = event;
  });

  // Run simulation for a few frames to ensure collision
  for (let i = 0; i < 10; i++) {
    physics.update();
  }

  expect(collisionHappened).toBe(true);
  expect(receivedEvent).toBeTruthy();

  if (receivedEvent) {
    const entities = [receivedEvent.entityA, receivedEvent.entityB];
    expect(entities).toContain(entity1);
    expect(entities).toContain(entity2);
  }
});

finish();

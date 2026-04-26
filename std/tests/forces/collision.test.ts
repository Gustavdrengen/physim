import { test, expect } from '../../test.ts';
import { initCollisionForce } from 'physim/forces/collision';
import { Physics, Entity, Vec2 } from 'physim/base';
import { initBodyComponent, Body, createCircle } from 'physim/bodies';

await test('initCollisionForce - collision callback', async () => {
  const physics = new Physics();
  const bodyComponent = initBodyComponent(physics);
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

await test('initCollisionForce - constantPull matches base physics timing', async () => {
  const physics = new Physics();
  physics.constantPull = new Vec2(0, 10);

  const bodyComponent = initBodyComponent(physics);
  await initCollisionForce(physics, bodyComponent);

  const entity = new Entity(new Vec2(0, 0));
  entity.addComp(bodyComponent, Body.fromShape(createCircle(10)));
  entity.addComp(physics.velocity, new Vec2(0, 0));

  physics.update();

  expect(entity.pos.y).toBeCloseTo(0);
  expect(physics.velocity.get(entity)?.y).toBe(10);
});

await test('initCollisionForce - angular velocity sync with Rapier', async () => {
  const physics = new Physics();
  const bodyComponent = initBodyComponent(physics);
  const collisionForce = await initCollisionForce(physics, bodyComponent);

  const entity = new Entity(new Vec2(0, 0));
  const body = Body.fromShape(createCircle(10));
  body.angularVelocity = Math.PI; // π rad/s
  entity.addComp(bodyComponent, body);

  // Run a few frames to let the collision system sync angular velocity
  for (let i = 0; i < 5; i++) {
    physics.update();
  }

  // Angular velocity should be preserved after sync
  expect(body.angularVelocity).toBeCloseTo(Math.PI, 4);

  // Rotation should have increased due to angular velocity integration
  expect(body.rotation).toBeGreaterThan(0);
});
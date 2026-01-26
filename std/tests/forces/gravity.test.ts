import { test, expect, finish } from "../../test.ts";
import { initGravityForce } from "physim/forces/gravity";
import { Physics } from "physim/physics";
import { Entity } from "physim/ecs";
import { Vec2 } from "physim/vec";

test("initGravityForce - applies gravitational acceleration", () => {
  const physics = new Physics();
  const G = 10;

  const entity1 = new Entity(new Vec2(0, 0));
  physics.mass.set(entity1, 10);

  const entity2 = new Entity(new Vec2(10, 0));
  physics.mass.set(entity2, 20);

  // Clear default forces for this test to isolate gravity
  (physics as any).forces = [];

  initGravityForce(physics, G);

  // Manually run only the gravity force, not the subsequent velocity/position updates
  const gravityForce = (physics as any).forces[0];
  const forceFunc: (entity: Entity, mass: number) => void = gravityForce[1];

  // Call for entity1
  forceFunc(entity1, physics.mass.get(entity1)!);
  // Call for entity2
  forceFunc(entity2, physics.mass.get(entity2)!);

  const acc1 = physics.acceleration.get(entity1);
  const acc2 = physics.acceleration.get(entity2);

  expect(acc1).toBeTruthy();
  expect(acc2).toBeTruthy();

  // a1 = G * m2 / d^2
  const expectedAcc1Mag = (G * 20) / 100; // 2
  const expectedAcc1 = new Vec2(expectedAcc1Mag, 0);
  expect(acc1!.x).toBeCloseTo(expectedAcc1.x);
  expect(acc1!.y).toBeCloseTo(expectedAcc1.y);

  // a2 = G * m1 / d^2
  const expectedAcc2Mag = (G * 10) / 100; // 1
  const expectedAcc2 = new Vec2(-expectedAcc2Mag, 0);
  expect(acc2!.x).toBeCloseTo(expectedAcc2.x);
  expect(acc2!.y).toBeCloseTo(expectedAcc2.y);
});

finish();

import { test, expect } from "../test.ts";
import { Physics } from "../src/public/physics.ts";
import { Entity } from "../src/public/ecs.ts";
import { Vec2 } from "../src/public/vec.ts";

await test("Physics - basic movement (velocity)", () => {
  const physics = new Physics();
  const entity = new Entity(new Vec2(0, 0));

  physics.velocity.set(entity, new Vec2(60, 0)); // 60 units per second
  physics.update();

  expect(entity.pos.x).toBeCloseTo(1);
  expect(entity.pos.y).toBe(0);
});

await test("Physics - acceleration", () => {
  const physics = new Physics();
  const entity = new Entity(new Vec2(0, 0));

  physics.velocity.set(entity, new Vec2(0, 0));
  physics.acceleration.set(entity, new Vec2(10, 0));

  physics.update();

  // Acceleration updates velocity, then velocity updates position
  // In our Physics constructor:
  // priority 1: acc -> vel
  // priority 2: vel -> pos (using updated vel)
  // priority 3: constantPull (not used here)

  expect(physics.velocity.get(entity)?.x).toBe(10);
  expect(entity.pos.x).toBeCloseTo(10 / 60);
  expect(physics.acceleration.get(entity)?.x).toBe(0); // Acceleration should reset
});

await test("Physics - constantPull", () => {
  const physics = new Physics();
  const entity = new Entity(new Vec2(0, 0));

  physics.velocity.set(entity, new Vec2(0, 0));
  physics.constantPull = new Vec2(0, 10);

  physics.update();

  // priority 3 adds constantPull to velocity
  expect(physics.velocity.get(entity)?.y).toBe(10);
});

await test("Physics - registerForce", () => {
  const physics = new Physics();
  const entity = new Entity(new Vec2(0, 0));
  const myComp = physics.velocity;

  let customForceApplied = false;
  physics.registerForce(myComp, () => {
    customForceApplied = true;
  });

  myComp.set(entity, new Vec2(0, 0));
  physics.update();
  expect(customForceApplied).toBe(true);
});

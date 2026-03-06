import { test, expect } from "../../test.ts";
import { Camera } from "physim/display";
import { Vec2 } from "physim/vec";
import { Entity } from "physim/ecs";

// Camera tests
await test("Camera - constructor defaults", () => {
  const camera = new Camera();
  expect(camera.position).toEqual(Vec2.zero());
  expect(camera.zoom).toBe(1);
  expect(camera.rotation).toBe(0);
  expect(camera.target).toBeNull();
});

await test("Camera - shake", () => {
  const camera = new Camera();
  camera.shake(60, 10);
  expect(camera.shakeTime).toBe(60);
  expect(camera.shakeIntensity).toBe(10);
});

await test("Camera - update shake", () => {
  const camera = new Camera();
  camera.shake(1, 5);
  camera.update();
  expect(camera.shakeOffset.x).not.toBe(0); // Should have an offset
  expect(camera.shakeTime).toBe(0);
  camera.update();
  expect(camera.shakeOffset).toEqual(Vec2.zero()); // Should be zero after time runs out
});

await test("Camera - follow single entity", () => {
  const camera = new Camera();
  const entity = new Entity(new Vec2(100, 100));
  camera.follow(entity);
  camera.update();
  expect(camera.position).toEqual(new Vec2(100, 100));
});

await test("Camera - follow multiple entities", () => {
  const camera = new Camera();
  const entity1 = new Entity(new Vec2(100, 100));
  const entity2 = new Entity(new Vec2(300, 300));
  camera.follow([entity1, entity2]);
  camera.update();
  expect(camera.position).toEqual(new Vec2(200, 200));
});

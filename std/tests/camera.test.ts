import { test, expect } from "../test.ts";
import { Camera, Vec2, Entity } from "physim/base";

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
  expect((camera as any).shakeTime).toBe(60);
  expect((camera as any).shakeIntensity).toBe(10);
});

await test("Camera - update shake", () => {
  const camera = new Camera();
  camera.shake(1, 5);
  (camera as any).update();
  expect((camera as any).shakeOffset.x).not.toBe(0); // Should have an offset
  expect((camera as any).shakeTime).toBe(0);
  (camera as any).update();
  expect((camera as any).shakeOffset).toEqual(Vec2.zero()); // Should be zero after time runs out
});

await test("Camera - follow single entity", () => {
  const camera = new Camera();
  const entity = new Entity(new Vec2(100, 100));
  camera.follow(entity);
  (camera as any).update();
  expect(camera.position).toEqual(new Vec2(100, 100));
});

await test("Camera - follow multiple entities", () => {
  const camera = new Camera();
  const entity1 = new Entity(new Vec2(100, 100));
  const entity2 = new Entity(new Vec2(300, 300));
  camera.follow([entity1, entity2]);
  (camera as any).update();
  expect(camera.position).toEqual(new Vec2(200, 200));
});

await test("Camera - contains", () => {
  const camera = new Camera();
  camera.position = new Vec2(100, 100);
  camera.zoom = 1;
  camera.rotation = 0;

  const width = 800;
  const height = 600;

  // Center should be contained
  expect(camera.contains(new Vec2(100, 100), width, height)).toBeTruthy();

  // Points within bounds
  expect(camera.contains(new Vec2(150, 150), width, height)).toBeTruthy();
  // 100 + 400 = 500 is edge, so 499 is inside
  expect(camera.contains(new Vec2(499, 399), width, height)).toBeTruthy();
  // 100 - 400 = -300 is edge, so -299 is inside
  expect(camera.contains(new Vec2(-299, -199), width, height)).toBeTruthy();

  // Points outside bounds
  expect(camera.contains(new Vec2(501, 100), width, height)).toBeFalsy();
  expect(camera.contains(new Vec2(100, 401), width, height)).toBeFalsy();
});

await test("Camera - contains with zoom", () => {
  const camera = new Camera();
  camera.position = new Vec2(0, 0);
  camera.zoom = 2; // Viewport covers half the world area

  const width = 100;
  const height = 100;

  // Viewport at zoom=1: [-50, 50] x [-50, 50]
  // Viewport at zoom=2: [-25, 25] x [-25, 25]

  expect(camera.contains(new Vec2(20, 20), width, height)).toBeTruthy();
  expect(camera.contains(new Vec2(30, 30), width, height)).toBeFalsy();
});

await test("Camera - contains with rotation", () => {
  const camera = new Camera();
  camera.position = new Vec2(0, 0);
  camera.rotation = Math.PI / 2; // 90 deg clockwise

  const width = 100;
  const height = 10;

  // Viewport at rotation=0: [-50, 50] x [-5, 5]
  // Viewport at rotation=90: [-5, 5] x [-50, 50] (world coordinates)

  expect(camera.contains(new Vec2(0, 40), width, height)).toBeTruthy();
  expect(camera.contains(new Vec2(40, 0), width, height)).toBeFalsy();
});

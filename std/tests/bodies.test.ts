import { test, expect } from "../test.ts";
import {
  Body,
  createCircle,
  createHollowPolygon,
  createPolygon,
  createRectangle,
  createRegularPolygon,
  createRing,
  getRegularPolygonVertices,
  initBodyComponent,
} from "physim/bodies";
import { Vec2, Physics, Entity } from "physim/base";

await test("Shape creation functions", () => {
  const circle = createCircle(10);
  expect(circle.type).toBe("circle");
  expect(circle.radius).toBe(10);

  const rect = createRectangle(20, 40);
  expect(rect.type).toBe("polygon");
  expect((rect as any).vertices.length).toBe(4);
  expect((rect as any).vertices[0]).toEqual(new Vec2(-10, -20));
  expect((rect as any).vertices[1]).toEqual(new Vec2(10, -20));
  expect((rect as any).vertices[2]).toEqual(new Vec2(10, 20));
  expect((rect as any).vertices[3]).toEqual(new Vec2(-10, 20));

  const polygon = createPolygon([new Vec2(0, 0), new Vec2(10, 0), new Vec2(0, 10)]);
  expect(polygon.type).toBe("polygon");
  expect(polygon.vertices.length).toBe(3);
  expect(polygon.vertices[0]).toEqual(new Vec2(0, 0));

  const regularPoly = createRegularPolygon(3, 10);
  expect(regularPoly.type).toBe("polygon");
  expect(regularPoly.vertices.length).toBe(3);
  // First vertex at (10, 0)
  expect(regularPoly.vertices[0].x).toBeCloseTo(10);
  expect(regularPoly.vertices[0].y).toBeCloseTo(0);

  const vertices = getRegularPolygonVertices(4, 10);
  expect(vertices.length).toBe(4);
  expect(vertices[0].x).toBeCloseTo(10);
  expect(vertices[1].y).toBeCloseTo(10); // 90 degrees

  const ring = createRing(5, 10);
  expect(ring.type).toBe("ring");
  expect(ring.innerRadius).toBe(5);
  expect(ring.outerRadius).toBe(10);

  const hollow = createHollowPolygon([new Vec2(0, 0), new Vec2(100, 0), new Vec2(100, 100), new Vec2(0, 100)], 10);
  expect(hollow.type).toBe("hollow_polygon");
  expect(hollow.vertices.length).toBe(4);
  expect(hollow.width).toBe(10);
});

await test("Body.fromShape - circle", () => {
  const body = Body.fromShape(createCircle(10));
  expect(body.parts.length).toBe(1);
  expect(body.vertices.length).toBe(1);
  expect(body.vertices[0].length).toBe(32); // Approximate circle
  expect(body.aabb.min.x).toBeCloseTo(-10);
  expect(body.aabb.max.x).toBeCloseTo(10);
});

await test("Body.fromShape - rectangle", () => {
  const body = Body.fromShape(createRectangle(20, 10));
  expect(body.parts.length).toBe(1);
  expect(body.vertices.length).toBe(1);
  expect(body.vertices[0].length).toBe(4);
  expect(body.aabb.min).toEqual(new Vec2(-10, -5));
  expect(body.aabb.max).toEqual(new Vec2(10, 5));
});

await test("Body.fromShape - ring", () => {
  const body = Body.fromShape(createRing(5, 10));
  expect(body.parts.length).toBe(1);
  expect(body.vertices.length).toBe(1); // One full ring segment
  expect(body.aabb.min.x).toBeCloseTo(-10);
  expect(body.aabb.max.x).toBeCloseTo(10);
});

await test("Body.fromShape - hollow_polygon", () => {
  const hollow = createHollowPolygon([new Vec2(-50, -50), new Vec2(50, -50), new Vec2(50, 50), new Vec2(-50, 50)], 20);
  const body = Body.fromShape(hollow);
  expect(body.parts.length).toBe(1);
  expect(body.vertices.length).toBe(4); // 4 walls
  // AABB should be extended by half width (10)
  expect(body.aabb.min.x).toBeCloseTo(-60);
  expect(body.aabb.max.x).toBeCloseTo(60);
});

await test("Body rotation", () => {
  const rect = createRectangle(20, 10);
  const body = Body.fromShape(rect, Math.PI / 2);
  expect(body.rotation).toBe(Math.PI / 2);
  
  const body2 = new Body([{ shape: rect, position: Vec2.zero(), rotation: Math.PI / 2 }]);
  
  // Original rect vertices: (-10,-5), (10,-5), (10,5), (-10,5)
  // Rotated by 90 deg: (5,-10), (5,10), (-5,10), (-5,-10)
  expect(body2.vertices[0][0].x).toBeCloseTo(5);
  expect(body2.vertices[0][0].y).toBeCloseTo(-10);
});

await test("Body.split", () => {
  const rect = createRectangle(20, 20);
  const body = Body.fromShape(rect);
  const shards = Body.split(body, 4);

  expect(shards.length).toBe(4);
  for (const shard of shards) {
    expect(shard.parts.length).toBe(1);
    expect(shard.vertices[0].length).toBeGreaterThanOrEqual(3);
    // Each shard should be within the original AABB
    expect(shard.aabb.min.x).toBeGreaterThanOrEqual(-10.1);
    expect(shard.aabb.max.x).toBeLessThanOrEqual(10.1);
  }
});

await test("Body angularVelocity property", () => {
  const body = Body.fromShape(createCircle(10));
  expect(body.angularVelocity).toBe(0);
  
  body.angularVelocity = Math.PI;
  expect(body.angularVelocity).toBe(Math.PI);
});

await test("Body.fromShape with initialAngularVelocity", () => {
  const body = Body.fromShape(createCircle(10), 0, Math.PI / 2);
  expect(body.angularVelocity).toBe(Math.PI / 2);
  expect(body.rotation).toBe(0);
});

await test("Body constructor with initialAngularVelocity", () => {
  const rect = createRectangle(20, 10);
  const body = new Body([{ shape: rect, position: Vec2.zero(), rotation: 0 }], 0, Math.PI);
  expect(body.angularVelocity).toBe(Math.PI);
});

await test("Angular velocity integration", () => {
  const physics = new Physics();
  const bodyComponent = initBodyComponent(physics);
  
  const body = Body.fromShape(createCircle(10));
  body.angularVelocity = Math.PI; // π rad/s
  
  const entity = new Entity(new Vec2(0, 0));
  entity.addComp(bodyComponent, body);
  
  const initialRotation = body.rotation;
  
  // After 1 frame (1/60 second), rotation should increase by π/60
  physics.update();
  
  const expectedRotation = initialRotation + Math.PI / 60;
  expect(body.rotation).toBeCloseTo(expectedRotation, 5);
});

await test("Angular velocity integration - multiple frames", () => {
  const physics = new Physics();
  const bodyComponent = initBodyComponent(physics);
  
  const body = Body.fromShape(createCircle(10));
  body.angularVelocity = Math.PI * 2; // 2π rad/s (one full rotation per second)
  
  const entity = new Entity(new Vec2(0, 0));
  entity.addComp(bodyComponent, body);
  
  // After 60 frames (1 second), should complete one full rotation
  for (let i = 0; i < 60; i++) {
    physics.update();
  }
  
  expect(body.rotation).toBeCloseTo(Math.PI * 2, 4);
});

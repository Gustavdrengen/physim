import { test, expect } from "../test.ts";
import { Body, createCircle, createRectangle, createRing } from "../src/public/bodies.ts";
import { Vec2 } from "../src/public/vec.ts";

await test("Shape creation functions", () => {
  const circle = createCircle(10);
  expect(circle.type).toBe("circle");
  expect(circle.radius).toBe(10);

  const rect = createRectangle(20, 40);
  expect(rect.type).toBe("polygon");
  expect(rect.vertices.length).toBe(4);
  expect(rect.vertices[0]).toEqual(new Vec2(-10, -20));
  expect(rect.vertices[1]).toEqual(new Vec2(10, -20));
  expect(rect.vertices[2]).toEqual(new Vec2(10, 20));
  expect(rect.vertices[3]).toEqual(new Vec2(-10, 20));

  const ring = createRing(5, 10);
  expect(ring.type).toBe("ring");
  expect(ring.innerRadius).toBe(5);
  expect(ring.outerRadius).toBe(10);
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

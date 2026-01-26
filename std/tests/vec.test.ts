import { test, expect, finish } from "../test.ts";
import { Vec2 } from "../src/public/vec.ts";

test("Vec2.zero", () => {
  const zero = Vec2.zero();
  expect(zero.x).toBe(0);
  expect(zero.y).toBe(0);
});

test("Vec2 constructor", () => {
  const v = new Vec2(1, 2);
  expect(v.x).toBe(1);
  expect(v.y).toBe(2);
});

test("Vec2.add", () => {
  const v1 = new Vec2(1, 2);
  const v2 = new Vec2(3, 4);
  const result = v1.add(v2);
  expect(result.x).toBe(4);
  expect(result.y).toBe(6);
});

test("Vec2.sub", () => {
  const v1 = new Vec2(3, 4);
  const v2 = new Vec2(1, 2);
  const result = v1.sub(v2);
  expect(result.x).toBe(2);
  expect(result.y).toBe(2);
});

test("Vec2.scale", () => {
  const v = new Vec2(1, 2);
  const result = v.scale(3);
  expect(result.x).toBe(3);
  expect(result.y).toBe(6);
});

test("Vec2.dot", () => {
  const v1 = new Vec2(1, 2);
  const v2 = new Vec2(3, 4);
  const result = v1.dot(v2);
  expect(result).toBe(11); // 1*3 + 2*4
});

test("Vec2.length", () => {
  const v = new Vec2(3, 4);
  const result = v.length();
  expect(result).toBe(5);
});

test("Vec2.normalize", () => {
  const v = new Vec2(3, 4);
  const result = v.normalize();
  expect(result.x).toBe(0.6);
  expect(result.y).toBe(0.8);
  expect(result.length()).toBe(1);
});

test("Vec2.normalize zero vector", () => {
  const v = new Vec2(0, 0);
  const result = v.normalize();
  expect(result.x).toBe(0);
  expect(result.y).toBe(0);
});

test("Vec2.average", () => {
  const vectors = [new Vec2(1, 2), new Vec2(3, 4), new Vec2(5, 6)];
  const result = Vec2.average(vectors);
  expect(result.x).toBe(3);
  expect(result.y).toBe(4);
});

test("Vec2.average empty array", () => {
  const vectors: Vec2[] = [];
  const result = Vec2.average(vectors);
  expect(result.x).toBe(0);
  expect(result.y).toBe(0);
});

test("Vec2.angle", () => {
  const v1 = new Vec2(1, 0);
  expect(v1.angle()).toBe(0);

  const v2 = new Vec2(0, 1);
  expect(v2.angle()).toBe(Math.PI / 2);

  const v3 = new Vec2(-1, 0);
  expect(v3.angle()).toBe(Math.PI);

  const v4 = new Vec2(0, -1);
  expect(v4.angle()).toBe(-Math.PI / 2);
});

test("Vec2.random", () => {
    const magnitude = 5;
    const v = Vec2.random(magnitude);
    // The length should be very close to the magnitude, accounting for floating point inaccuracies
    expect(Math.abs(v.length() - magnitude) < 1e-9).toBe(true);
});

finish();

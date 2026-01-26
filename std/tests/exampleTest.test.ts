import { test, testAsync, expect, finish, getPixelColor } from "../test.ts";
import { Color } from "../src/base/draw/color.ts";

// Basic equality tests
test("toBe - strict equality", () => {
  expect(2 + 2).toBe(4);
  expect("hello").toBe("hello");
  expect(true).toBe(true);
});

test("toEqual - deep equality", () => {
  expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 });
  expect([1, 2, 3]).toEqual([1, 2, 3]);
});

// Truthiness tests
test("toBeTruthy", () => {
  expect(true).toBeTruthy();
  expect(1).toBeTruthy();
  expect("text").toBeTruthy();
  expect({}).toBeTruthy();
});

test("toBeFalsy", () => {
  expect(false).toBeFalsy();
  expect(0).toBeFalsy();
  expect("").toBeFalsy();
  expect(null).toBeFalsy();
});

// Null and undefined tests
test("toBeNull", () => {
  expect(null).toBeNull();
});

test("toBeUndefined", () => {
  let x;
  expect(x).toBeUndefined();
  expect(undefined).toBeUndefined();
});

// Collection tests
test("toContain - array", () => {
  expect([1, 2, 3, 4]).toContain(3);
  expect(["apple", "banana"]).toContain("apple");
});

test("toContain - string", () => {
  expect("hello world").toContain("world");
  expect("typescript").toContain("script");
});

// Exception testing
test("toThrow - basic", () => {
  expect(() => {
    throw new Error("Something went wrong");
  }).toThrow();
});

test("toThrow - with message", () => {
  expect(() => {
    throw new Error("Invalid input");
  }).toThrow("Invalid input");
});

test("toThrow - with regex", () => {
  expect(() => {
    throw new Error("Error: code 404");
  }).toThrow(/code \d+/);
});

// Async test example
testAsync("async operation", async () => {
  const result = await Promise.resolve(42);
  expect(result).toBe(42);
});

testAsync("async with timeout", async () => {
  await new Promise(resolve => setTimeout(resolve, 10));
  expect(true).toBeTruthy();
});

// Example of instantiating values outside test blocks
const commonValue = 100;
const commonObject = { key: "value" };

test("should use commonValue instantiated outside the test block", () => {
  expect(commonValue).toBe(100);
});

test("should use commonObject instantiated outside the test block", () => {
  expect(commonObject.key).toBe("value");
});

// Example of pixel color testing: check if a pixel is transparent black by default
test("pixel at (10, 10) should be transparent black by default", () => {
  const pixelColor = getPixelColor(10, 10);
  expect(pixelColor).toEqual(new Color(0, 0, 0, 0));
});

// toBeCloseTo tests
test("toBeCloseTo - numbers", () => {
  expect(3.14159).toBeCloseTo(3.14);
  expect(3.14159).toBeCloseTo(3.141, 2);
  expect(1.0).toBeCloseTo(1.000001);
});

// 'not' modifier tests
test("not.toBe", () => {
  expect(1).not.toBe(2);
  expect("hello").not.toBe("world");
});

test("not.toEqual", () => {
  expect({ a: 1 }).not.toEqual({ a: 2 });
});

test("not.toContain", () => {
  expect([1, 2, 3]).not.toContain(4);
});

// toBeGreaterThan and toBeLessThan tests
test("toBeGreaterThan", () => {
  expect(10).toBeGreaterThan(5);
  expect(10).not.toBeGreaterThan(15);
});

test("toBeLessThan", () => {
  expect(5).toBeLessThan(10);
  expect(10).not.toBeLessThan(5);
});

finish();
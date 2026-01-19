import { test, testAsync, expect, finish } from "../test.ts";

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

finish();

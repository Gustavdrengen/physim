import { test, expect } from "../test.ts";
import { prompt, select } from "physim/input";

await test("prompt returns user input", () => {
  window.prompt = () => "John Doe";
  const result = prompt("Enter your name:");
  expect(result).toBe("John Doe");
});

await test("prompt returns null when cancelled", () => {
  window.prompt = () => null;
  const result = prompt("Enter your name:");
  expect(result).toBeNull();
});

await test("prompt with default value", () => {
  let capturedMessage = "";
  let capturedDefault = "";
  window.prompt = (message, defaultValue) => {
    capturedMessage = message ?? "";
    capturedDefault = defaultValue ?? "";
    return defaultValue ?? "";
  };
  const result = prompt("Enter your name:", "Guest");
  expect(result).toBe("Guest");
  expect(capturedMessage).toBe("Enter your name:");
  expect(capturedDefault).toBe("Guest");
});

await test("prompt without default value", () => {
  let capturedDefault = "";
  window.prompt = (_message, defaultValue) => {
    capturedDefault = defaultValue ?? "";
    return "test";
  };
  prompt("Enter value:");
  expect(capturedDefault).toBe("");
});

await test("select returns selected option", () => {
  window.prompt = () => "2";
  const options = ["red", "green", "blue"];
  const result = select("Choose a color:", options);
  expect(result).toBe("green");
});

await test("select returns null when cancelled", () => {
  window.prompt = () => null;
  const options = ["red", "green", "blue"];
  const result = select("Choose a color:", options);
  expect(result).toBeNull();
});

await test("select returns null on invalid input - non-number", () => {
  window.prompt = () => "abc";
  const options = ["red", "green", "blue"];
  const result = select("Choose a color:", options);
  expect(result).toBeNull();
});

await test("select returns null on invalid input - out of range", () => {
  window.prompt = () => "5";
  const options = ["red", "green", "blue"];
  const result = select("Choose a color:", options);
  expect(result).toBeNull();
});

await test("select returns null on invalid input - zero", () => {
  window.prompt = () => "0";
  const options = ["red", "green", "blue"];
  const result = select("Choose a color:", options);
  expect(result).toBeNull();
});

await test("select handles whitespace in input", () => {
  window.prompt = () => "  2  ";
  const options = ["red", "green", "blue"];
  const result = select("Choose a color:", options);
  expect(result).toBe("green");
});

await test("select with number options", () => {
  window.prompt = () => "3";
  const options = [10, 20, 30];
  const result = select("Choose a number:", options);
  expect(result).toBe(30);
});

await test("select with object options", () => {
  window.prompt = () => "1";
  const options = [{ id: 1 }, { id: 2 }];
  const result = select("Choose an object:", options);
  expect(result).toEqual({ id: 1 });
});

await test("select displays options correctly", () => {
  let capturedMessage = "";
  window.prompt = (message) => {
    capturedMessage = message ?? "";
    return null;
  };
  const options = ["red", "green", "blue"];
  select("Choose a color:", options);
  expect(capturedMessage).toContain("Choose a color:");
  expect(capturedMessage).toContain("1. red");
  expect(capturedMessage).toContain("2. green");
  expect(capturedMessage).toContain("3. blue");
});

await test("select with empty options array", () => {
  window.prompt = () => "1";
  const options: string[] = [];
  const result = select("Choose:", options);
  expect(result).toBeNull();
});

await test("select with single option", () => {
  window.prompt = () => "1";
  const options = ["only"];
  const result = select("Choose:", options);
  expect(result).toBe("only");
});

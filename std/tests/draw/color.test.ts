import { test, expect, finish } from "../../test.ts";
import { Color } from "physim/draw";

// Common test values
const redColor = new Color(255, 0, 0);
const greenColor = new Color(0, 255, 0);
const blueColor = new Color(0, 0, 255);
const transparentRed = new Color(255, 0, 0, 0.5);

test("Color constructor should clamp values and set alpha", () => {
  const color = new Color(300, -10, 128, 0.5);
  expect(color.r).toBe(255);
  expect(color.g).toBe(0);
  expect(color.b).toBe(128);
  expect(color.a).toBe(0.5);

  const defaultAlphaColor = new Color(10, 20, 30);
  expect(defaultAlphaColor.a).toBe(1);
});

test("Color.fromRGB should create color correctly", () => {
  const color = Color.fromRGB(255, 0, 128, 0.7);
  expect(color.r).toBe(255);
  expect(color.g).toBe(0);
  expect(color.b).toBe(128);
  expect(color.a).toBe(0.7);
});

test("Color.fromHex should parse various hex formats", () => {
  // #RGB
  let color = Color.fromHex("#F00");
  expect(color.r).toBe(redColor.r);
  expect(color.g).toBe(redColor.g);
  expect(color.b).toBe(redColor.b);
  expect(color.a).toBe(1);

  // #RRGGBB
  color = Color.fromHex("#00FF00");
  expect(color.r).toBe(greenColor.r);
  expect(color.g).toBe(greenColor.g);
  expect(color.b).toBe(greenColor.b);
  expect(color.a).toBe(1);

  // #RGBA
  color = Color.fromHex("#000F");
  expect(color.r).toBe(0);
  expect(color.g).toBe(0);
  expect(color.b).toBe(0);
  expect(color.a).toBe(1); // F = 15/255 = 0.0588... rounded to 1

  // #RRGGBBAA
  color = Color.fromHex("#00000080"); // 80 = 128/255 = 0.5
  expect(color.r).toBe(0);
  expect(color.g).toBe(0);
  expect(color.b).toBe(0);
  expect(color.a).toBeCloseTo(0.5, 2);

  // Without hash
  color = Color.fromHex("FF00FF");
  expect(color.r).toBe(255);
  expect(color.g).toBe(0);
  expect(color.b).toBe(255);
});

test("Color.fromHSL should convert HSL to RGB", () => {
  // Red
  let color = Color.fromHSL(0, 1, 0.5);
  expect(color.r).toBe(redColor.r);
  expect(color.g).toBe(redColor.g);
  expect(color.b).toBe(redColor.b);

  // Green
  color = Color.fromHSL(120, 1, 0.5);
  expect(color.r).toBe(greenColor.r);
  expect(color.g).toBe(greenColor.g);
  expect(color.b).toBe(greenColor.b);

  // Blue
  color = Color.fromHSL(240, 1, 0.5);
  expect(color.r).toBe(blueColor.r);
  expect(color.g).toBe(blueColor.g);
  expect(color.b).toBe(blueColor.b);

  // Gray (saturation 0)
  color = Color.fromHSL(0, 0, 0.5);
  expect(color.r).toBe(128);
  expect(color.g).toBe(128);
  expect(color.b).toBe(128);

  // With alpha
  color = Color.fromHSL(0, 1, 0.5, 0.5);
  expect(color.a).toBe(0.5);
});

test("Color.fromHSV should convert HSV to RGB", () => {
  // Red
  let color = Color.fromHSV(0, 1, 1);
  expect(color.r).toBe(redColor.r);
  expect(color.g).toBe(redColor.g);
  expect(color.b).toBe(redColor.b);

  // Green
  color = Color.fromHSV(120, 1, 1);
  expect(color.r).toBe(greenColor.r);
  expect(color.g).toBe(greenColor.g);
  expect(color.b).toBe(greenColor.b);

  // Blue
  color = Color.fromHSV(240, 1, 1);
  expect(color.r).toBe(blueColor.r);
  expect(color.g).toBe(blueColor.g);
  expect(color.b).toBe(blueColor.b);

  // Gray (saturation 0)
  color = Color.fromHSV(0, 0, 0.5);
  expect(color.r).toBe(128);
  expect(color.g).toBe(128);
  expect(color.b).toBe(128);

  // With alpha
  color = Color.fromHSV(0, 1, 1, 0.5);
  expect(color.a).toBe(0.5);
});

test("Color.fromString should parse various string formats", () => {
  // Hex
  let color = Color.fromString("#FF0000");
  expect(color.r).toBe(redColor.r);
  expect(color.g).toBe(redColor.g);
  expect(color.b).toBe(redColor.b);

  // RGB
  color = Color.fromString("rgb(0, 255, 0)");
  expect(color.r).toBe(greenColor.r);
  expect(color.g).toBe(greenColor.g);
  expect(color.b).toBe(greenColor.b);

  // RGBA
  color = Color.fromString("rgba(0, 0, 255, 0.5)");
  expect(color.r).toBe(blueColor.r);
  expect(color.g).toBe(blueColor.g);
  expect(color.b).toBe(blueColor.b);
  expect(color.a).toBe(0.5);

  // HSL
  color = Color.fromString("hsl(120, 100%, 50%)");
  expect(color.r).toBe(greenColor.r);
  expect(color.g).toBe(greenColor.g);
  expect(color.b).toBe(greenColor.b);

  // HSLA
  color = Color.fromString("hsla(240, 100%, 50%, 0.2)");
  expect(color.r).toBe(blueColor.r);
  expect(color.g).toBe(blueColor.g);
  expect(color.b).toBe(blueColor.b);
  expect(color.a).toBe(0.2);
});

test("Color.toCSS should return correct CSS string", () => {
  expect(redColor.toCSS()).toBe("rgb(255, 0, 0)");
  expect(transparentRed.toCSS()).toBe("rgba(255, 0, 0, 0.5)");
});

test("Color.toHex should return correct hex string", () => {
  expect(redColor.toHex()).toBe("#ff0000");
  expect(transparentRed.toHex(true)).toBe("#ff000080");
  expect(transparentRed.toHex(false)).toBe("#ff0000");
});

test("Color.withAlpha should return a new color with updated alpha", () => {
  const originalColor = new Color(255, 255, 255, 1);
  const newColor = originalColor.withAlpha(0.5);

  expect(newColor.r).toBe(originalColor.r);
  expect(newColor.g).toBe(originalColor.g);
  expect(newColor.b).toBe(originalColor.b);
  expect(newColor.a).toBe(0.5);
  expect(newColor).not.toBe(originalColor); // Should be a new instance
});

finish();

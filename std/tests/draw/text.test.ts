import { test, expect } from "../../test.ts";
import { Draw, Vec2, Color } from "physim/base";

function setupMockCanvas() {
  const mockCtx = {
    fillStyle: "",
    font: "",
    textAlign: "" as CanvasTextAlign,
    textBaseline: "" as CanvasTextBaseline,
    fillText: () => {},
  };

  const originalSim = (globalThis as any).sim;
  (globalThis as any).sim = {
    ctx: mockCtx,
    log: originalSim?.log?.bind(originalSim),
  };

  return mockCtx;
}

await test("Draw.text - basic usage", () => {
  const ctx = setupMockCanvas();
  const fillTextSpy = [] as any[];
  ctx.fillText = (...args: any[]) => fillTextSpy.push(args);

  const pos = new Vec2(100, 200);
  Draw.text(pos, "Hello World", "20px Arial", "red");

  expect(ctx.font).toBe("20px Arial");
  expect(ctx.fillStyle).toBe("red");
  expect(ctx.textAlign).toBe("center");
  expect(ctx.textBaseline).toBe("middle");
  expect(fillTextSpy.length).toBe(1);
  expect(fillTextSpy[0]).toEqual(["Hello World", 100, 200]);
});

await test("Draw.text - default values", () => {
  const ctx = setupMockCanvas();
  const pos = new Vec2(0, 0);
  Draw.text(pos, "Test");

  expect(ctx.font).toBe("16px Arial");
  expect(ctx.fillStyle).toBe("rgb(255, 255, 255)");
  expect(ctx.textAlign).toBe("center");
  expect(ctx.textBaseline).toBe("middle");
});

await test("Draw.text - with Color object", () => {
  const ctx = setupMockCanvas();
  const pos = new Vec2(50, 50);
  Draw.text(pos, "Colored", "14px sans-serif", Color.fromRGB(255, 0, 0));

  expect(ctx.fillStyle).toBe("rgb(255, 0, 0)");
});

await test("Draw.text - custom alignment", () => {
  const ctx = setupMockCanvas();
  const pos = new Vec2(100, 100);
  Draw.text(pos, "Left Top", "12px monospace", "black", "left", "top");

  expect(ctx.textAlign).toBe("left");
  expect(ctx.textBaseline).toBe("top");
});

await test("Draw.text - all alignment options", () => {
  const ctx = setupMockCanvas();
  const pos = new Vec2(0, 0);

  Draw.text(pos, "test", "12px Arial", "black", "right", "bottom");
  expect(ctx.textAlign).toBe("right");
  expect(ctx.textBaseline).toBe("bottom");

  Draw.text(pos, "test", "12px Arial", "black", "start", "hanging");
  expect(ctx.textAlign).toBe("start");
  expect(ctx.textBaseline).toBe("hanging");
});

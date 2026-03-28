import { test, expect } from "../../test.ts";
import { Draw, Vec2, Color } from "physim/base";

// Mock canvas context
function setupMockCanvas() {
  const mockCtx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "" as CanvasTextAlign,
    textBaseline: "" as CanvasTextBaseline,
    fill: () => {},
    stroke: () => {},
    beginPath: () => {},
    closePath: () => {},
    arc: () => {},
    fillRect: () => {},
    roundRect: () => {},
    moveTo: () => {},
    lineTo: () => {},
    fillText: () => {},
    canvas: { width: 800, height: 600 },
  };

  const originalSim = (globalThis as any).sim;
  (globalThis as any).sim = {
    ctx: mockCtx,
    resizeCanvas: (width: number, height: number) => {
      mockCtx.canvas.width = width;
      mockCtx.canvas.height = height;
    },
    log: originalSim?.log?.bind(originalSim),
  };

  return mockCtx;
}

await test("Draw.clear", () => {
  const ctx = setupMockCanvas();
  const fillRectSpy = [] as any[];
  ctx.fillRect = (...args: any[]) => fillRectSpy.push(args);

  Draw.clear(Color.fromRGB(100, 150, 200));
  expect(ctx.fillStyle).toBe("rgb(100, 150, 200)");
  expect(fillRectSpy.length).toBe(1);
  expect(fillRectSpy[0]).toEqual([0, 0, 800, 600]);
});

await test("Draw.clear - default black", () => {
  const ctx = setupMockCanvas();
  const fillRectSpy = [] as any[];
  ctx.fillRect = (...args: any[]) => fillRectSpy.push(args);

  Draw.clear();
  expect(ctx.fillStyle).toBe("rgb(0, 0, 0)");
});

await test("Draw.circle", () => {
  const ctx = setupMockCanvas();
  const arcSpy = [] as any[];
  ctx.beginPath = () => {};
  ctx.arc = (...args: any[]) => arcSpy.push(args);

  const pos = new Vec2(100, 200);
  Draw.circle(pos, 50, "red");

  expect(ctx.fillStyle).toBe("red");
  expect(arcSpy.length).toBe(1);
  expect(arcSpy[0][0]).toBe(100);
  expect(arcSpy[0][1]).toBe(200);
  expect(arcSpy[0][2]).toBe(50);
});

await test("Draw.circle - default white", () => {
  const ctx = setupMockCanvas();
  const pos = new Vec2(0, 0);
  Draw.circle(pos, 10);
  expect(ctx.fillStyle).toBe("rgb(255, 255, 255)");
});

await test("Draw.rect - without border radius", () => {
  const ctx = setupMockCanvas();
  const fillRectSpy = [] as any[];
  ctx.fillRect = (...args: any[]) => fillRectSpy.push(args);

  const pos = new Vec2(100, 150);
  Draw.rect(pos, 60, 40, "blue");

  expect(ctx.fillStyle).toBe("blue");
  expect(fillRectSpy.length).toBe(1);
  expect(fillRectSpy[0]).toEqual([70, 130, 60, 40]);
});

await test("Draw.rect - with border radius", () => {
  const ctx = setupMockCanvas();
  const roundRectSpy = [] as any[];
  ctx.beginPath = () => {};
  ctx.roundRect = (...args: any[]) => roundRectSpy.push(args);

  const pos = new Vec2(100, 150);
  Draw.rect(pos, 60, 40, "green", 10);

  expect(ctx.fillStyle).toBe("green");
  expect(roundRectSpy.length).toBe(1);
  expect(roundRectSpy[0]).toEqual([70, 130, 60, 40, 10]);
});

await test("Draw.line", () => {
  const ctx = setupMockCanvas();
  const lineToSpy = [] as any[];
  ctx.beginPath = () => {};
  ctx.moveTo = () => {};
  ctx.lineTo = (...args: any[]) => lineToSpy.push(args);

  const start = new Vec2(0, 0);
  const end = new Vec2(100, 200);
  Draw.line(start, end, "yellow", 3);

  expect(ctx.strokeStyle).toBe("yellow");
  expect(ctx.lineWidth).toBe(3);
  expect(lineToSpy.length).toBe(1);
  expect(lineToSpy[0]).toEqual([100, 200]);
});

await test("Draw.line - default values", () => {
  const ctx = setupMockCanvas();
  const start = new Vec2(0, 0);
  const end = new Vec2(50, 50);
  Draw.line(start, end);

  expect(ctx.strokeStyle).toBe("rgb(255, 255, 255)");
  expect(ctx.lineWidth).toBe(1);
});

await test("Draw.vector", () => {
  const ctx = setupMockCanvas();
  const lineToSpy = [] as any[];
  ctx.beginPath = () => {};
  ctx.moveTo = () => {};
  ctx.lineTo = (...args: any[]) => lineToSpy.push(args);

  const pos = new Vec2(10, 10);
  const vec = new Vec2(5, 0);
  Draw.vector(pos, vec, "red", 2, 4);

  expect(lineToSpy.length).toBe(1);
  expect(lineToSpy[0]).toEqual([20, 10]);
});

await test("Draw.points", () => {
  const ctx = setupMockCanvas();
  const arcSpy = [] as any[];
  ctx.beginPath = () => {};
  ctx.arc = (...args: any[]) => arcSpy.push(args);

  const points = [new Vec2(0, 0), new Vec2(10, 10), new Vec2(20, 20)];
  Draw.points(points, 5, "cyan");

  expect(ctx.fillStyle).toBe("cyan");
  expect(arcSpy.length).toBe(3);
});

await test("Draw.points - default values", () => {
  const ctx = setupMockCanvas();
  const arcSpy = [] as any[];
  ctx.beginPath = () => {};
  ctx.arc = (...args: any[]) => arcSpy.push(args);

  const points = [new Vec2(0, 0)];
  Draw.points(points);

  expect(ctx.fillStyle).toBe("rgb(255, 255, 255)");
  expect(arcSpy[0][2]).toBe(2);
});

await test("Draw.setCanvasSize", () => {
  setupMockCanvas();

  Draw.setCanvasSize(1024, 768);
  expect((globalThis as any).sim.ctx.canvas.width).toBe(1024);
  expect((globalThis as any).sim.ctx.canvas.height).toBe(768);
});

await test("Draw.polygon - filled", () => {
  const ctx = setupMockCanvas();
  const lineToSpy = [] as any[];
  ctx.beginPath = () => {};
  ctx.moveTo = () => {};
  ctx.lineTo = (...args: any[]) => lineToSpy.push(args);

  const vertices = [new Vec2(0, 0), new Vec2(10, 0), new Vec2(5, 10)];
  Draw.polygon(vertices, "purple", true);

  expect(ctx.fillStyle).toBe("purple");
  expect(lineToSpy.length).toBe(2);
});

await test("Draw.polygon - stroked", () => {
  const ctx = setupMockCanvas();
  const lineToSpy = [] as any[];
  ctx.beginPath = () => {};
  ctx.moveTo = () => {};
  ctx.lineTo = (...args: any[]) => lineToSpy.push(args);

  const vertices = [new Vec2(0, 0), new Vec2(10, 0), new Vec2(5, 10)];
  Draw.polygon(vertices, "orange", false, 3);

  expect(ctx.strokeStyle).toBe("orange");
  expect(ctx.lineWidth).toBe(3);
  expect(lineToSpy.length).toBe(2);
});

await test("Draw.polygon - less than 2 vertices", () => {
  setupMockCanvas();

  const vertices = [new Vec2(0, 0)];
  expect(() => Draw.polygon(vertices)).not.toThrow();
});

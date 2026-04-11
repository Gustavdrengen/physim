import { test, expect } from "../../../test.ts";
import { Vec2 } from "physim/base";
import { createSparkEffect } from "physim/effects/particles";

await test("createSparkEffect - defaults", () => {
  const options = createSparkEffect({
    position: new Vec2(100, 100),
  });

  expect(options.numParticles).toBe(50);
  expect(options.position).toEqual(new Vec2(100, 100));
  expect(options.initialVelocity.min).toBe(180);
  expect(options.initialVelocity.max).toBe(480);
  expect(options.acceleration!.y).toBe(0.015);
  expect(options.turbulence).toEqual({ frequency: 0.5, amplitude: 0.2 });
});

await test("createSparkEffect - custom velocity", () => {
  const options = createSparkEffect({
    position: new Vec2(0, 0),
    velocity: { min: 5, max: 15 },
  });

  expect(options.initialVelocity.min).toBe(300);
  expect(options.initialVelocity.max).toBe(900);
});

await test("createSparkEffect - custom direction", () => {
  const options = createSparkEffect({
    position: new Vec2(0, 0),
    direction: { angle: Math.PI / 4, spread: 1.5 },
  });

  expect(options.directionBias).not.toBeUndefined();
  expect(options.directionBias!.angle).toBe(Math.PI / 4);
  expect(options.directionBias!.spread).toBe(1.5);
});

await test("createSparkEffect - brightness affects color", () => {
  const brightOptions = createSparkEffect({
    position: new Vec2(0, 0),
    brightness: 1,
  });

  const dimOptions = createSparkEffect({
    position: new Vec2(0, 0),
    brightness: 0,
  });

  const brightColor = brightOptions.colorStages![0].color;
  const dimColor = dimOptions.colorStages![0].color;

  expect(brightColor.r).toBe(255);
  expect(brightColor.g).toBeGreaterThan(dimColor.g);
  expect(brightColor.b).toBeGreaterThan(dimColor.b);
});

await test("createSparkEffect - quick fade", () => {
  const quickOptions = createSparkEffect({
    position: new Vec2(0, 0),
    quickFade: true,
  });

  const longOptions = createSparkEffect({
    position: new Vec2(0, 0),
    quickFade: false,
  });

  expect(quickOptions.particleLifetime.max).toBeLessThan(0.5);
  expect(longOptions.particleLifetime.max).toBeGreaterThan(0.5);
});

await test("createSparkEffect - drag custom update", () => {
  const options = createSparkEffect({
    position: new Vec2(0, 0),
    drag: 0.95,
  });

  expect(options.customUpdate).not.toBeUndefined();
});

await test("createSparkEffect - no drag custom update", () => {
  const options = createSparkEffect({
    position: new Vec2(0, 0),
    drag: 1,
  });

  expect(options.customUpdate).toBeUndefined();
});

await test("createSparkEffect - size variation", () => {
  const options = createSparkEffect({
    position: new Vec2(0, 0),
    size: 2,
    sizeVariation: 1.5,
  });

  expect((options.scale as { start: number; end: number }).start).toBeCloseTo(1.5);
  expect((options.scale as { start: number; end: number }).end).toBe(0);
});

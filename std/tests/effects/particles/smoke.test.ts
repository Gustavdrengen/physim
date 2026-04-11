import { test, expect } from "../../../test.ts";
import { Vec2 } from "physim/base";
import { createSmokeEffect } from "physim/effects/particles";

await test("createSmokeEffect - defaults", () => {
  const options = createSmokeEffect({
    position: new Vec2(100, 100),
  });

  expect(options.numParticles).toBe(40);
  expect(options.position).toEqual(new Vec2(100, 100));
  expect(options.positionJitter).toBe(8);
  expect(options.scale).toEqual({ start: 0.5, end: 3 });
  expect(options.turbulence).toEqual({ frequency: 0.15, amplitude: 0.8 });
});

await test("createSmokeEffect - custom options", () => {
  const options = createSmokeEffect({
    position: new Vec2(200, 200),
    size: 2,
    count: 60,
    density: 0.7,
    expansion: 1.5,
    wind: 0.3,
  });

  expect(options.numParticles).toBe(60);
  expect(options.positionJitter).toBe(16);
  expect(options.scale).toEqual({ start: 1, end: 9 });
  expect(options.acceleration!.x).toBeCloseTo(5.4);
});

await test("createSmokeEffect - color stages", () => {
  const options = createSmokeEffect({
    position: new Vec2(0, 0),
    density: 0.5,
  });

  expect(options.colorStages).not.toBeUndefined();
  expect(options.colorStages!.length).toBe(4);
  expect(options.colorStages![0].position).toBe(0);
  expect(options.colorStages![3].position).toBe(1);
});

await test("createSmokeEffect - dark smoke", () => {
  const options = createSmokeEffect({
    position: new Vec2(0, 0),
    density: 1,
  });

  const startColor = options.colorStages![0].color;
  expect(startColor.r).toBeGreaterThan(150);
  expect(startColor.a).toBeGreaterThan(0.5);
});

await test("createSmokeEffect - light smoke", () => {
  const options = createSmokeEffect({
    position: new Vec2(0, 0),
    density: 0,
  });

  const startColor = options.colorStages![0].color;
  expect(startColor.r).toBeLessThan(120);
  expect(startColor.a).toBeLessThan(0.4);
});

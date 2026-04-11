import { test, expect } from "../../../test.ts";
import { Vec2 } from "physim/base";
import { createFireEffect } from "physim/effects/particles";

await test("createFireEffect - defaults", () => {
  const options = createFireEffect({
    position: new Vec2(100, 100),
  });

  expect(options.numParticles).toBe(80);
  expect(options.position).toEqual(new Vec2(100, 100));
  expect(options.positionJitter).toBe(15);
  expect(options.scale).toEqual({ start: 0.3, end: 1.5 });
  expect(options.turbulence).toEqual({ frequency: 0.3, amplitude: 0.5 });
});

await test("createFireEffect - custom options", () => {
  const options = createFireEffect({
    position: new Vec2(100, 100),
    size: 2,
    count: 100,
    intensity: 1.5,
  });

  expect(options.numParticles).toBe(150);
  expect(options.positionJitter).toBe(30);
  expect(options.scale).toEqual({ start: 0.6, end: 3 });
});

await test("createFireEffect - wind", () => {
  const options = createFireEffect({
    position: new Vec2(0, 0),
    wind: 0.5,
  });

  expect(options.acceleration!.x).toBeCloseTo(15);
});

await test("createFireEffect - temperature affects color", () => {
  const hotOptions = createFireEffect({
    position: new Vec2(0, 0),
    temperature: 1,
  });

  const coolOptions = createFireEffect({
    position: new Vec2(0, 0),
    temperature: 0,
  });

  const hotColor = hotOptions.colorStages![0].color;
  const coolColor = coolOptions.colorStages![0].color;

  expect(hotColor.g).toBeGreaterThan(coolColor.g);
  expect(hotColor.b).toBeGreaterThan(coolColor.b);
});

await test("createFireEffect - color stages", () => {
  const options = createFireEffect({
    position: new Vec2(0, 0),
  });

  expect(options.colorStages).not.toBeUndefined();
  expect(options.colorStages!.length).toBeGreaterThan(3);
  expect(options.colorStages![0].position).toBe(0);
  expect(options.colorStages![options.colorStages!.length - 1].position).toBe(1);
});

await test("createFireEffect - with smoke", () => {
  const options = createFireEffect({
    position: new Vec2(0, 0),
    withSmoke: true,
    smokeRate: 0.5,
  });

  expect(options.customUpdate).not.toBeUndefined();
});

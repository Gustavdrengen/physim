import { test, expect } from "../../../test.ts";
import { Vec2 } from "physim/base";
import { createFireEffect } from "physim/effects/particles";

await test("createFireEffect", () => {
  const options = createFireEffect({
    position: new Vec2(100, 100),
    size: 2,
    count: 10,
  });

  expect(options.numParticles).toBe(10);
  expect(options.position).toEqual(new Vec2(100, 100));
  expect(options.positionJitter).toBe(20);
  expect(options.scale).toEqual({ start: 1, end: 0 });
});

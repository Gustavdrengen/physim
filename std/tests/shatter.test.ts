import { test, expect } from "../test.ts";
import { Entity, Vec2, Simulation } from "physim/base";
import { Body, createRectangle, initBodyComponent } from "physim/bodies";
import { ParticleSystem } from "physim/particles";
import { shatter } from "physim/graphics";

await test("shatter utility", () => {
  const sim = new Simulation();
  const ps = new ParticleSystem(sim.display);
  const bodyComp = initBodyComponent();
  
  const rect = createRectangle(20, 20);
  const body = Body.fromShape(rect);
  
  const entity = Entity.create(new Vec2(100, 100), [
    [bodyComp, body]
  ]);

  // Initial state check
  expect(bodyComp.has(entity)).toBe(true);
  
  // Shatter the entity
  shatter(entity, body, ps, {
    numShards: 4,
    lifetime: { min: 10, max: 20 },
    speed: { min: 1, max: 2 },
  });

  // Entity should be destroyed (removed from components)
  expect(bodyComp.has(entity)).toBe(false);
  
  // Check if particles were emitted (internal state of ParticleSystem is hard to check directly,
  // but we can check if it runs without error and the entity is gone).
});

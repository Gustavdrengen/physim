import { test, expect } from "../test.ts";
import { Simulation } from "../src/public/simulation.ts";
import { initPointDisplayComponent, initBodyDisplayComponent } from "../src/public/graphics.ts";
import { initBodyComponent } from "../src/public/bodies.ts";
import { Component } from "../src/public/ecs.ts";

await test("initPointDisplayComponent", () => {
  const sim = new Simulation();
  const pointDisplay = initPointDisplayComponent(sim.display);
  expect(pointDisplay instanceof Component).toBe(true);
});

await test("initBodyDisplayComponent", () => {
  const sim = new Simulation();
  const bodyComponent = initBodyComponent();
  const bodyDisplay = initBodyDisplayComponent(sim.display, bodyComponent);
  expect(bodyDisplay instanceof Component).toBe(true);
});

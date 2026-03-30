import { test, expect } from "../test.ts";
import { Simulation, Component } from "physim/base";
import { initPointDisplayComponent, initBodyDisplayComponent } from "physim/graphics";
import { initBodyComponent } from "physim/bodies";

await test("initPointDisplayComponent", () => {
  const sim = new Simulation();
  const pointDisplay = initPointDisplayComponent(sim.display);
  expect(pointDisplay instanceof Component).toBe(true);
});

await test("initBodyDisplayComponent", () => {
  const sim = new Simulation();
  const bodyComponent = initBodyComponent(sim.physics);
  const bodyDisplay = initBodyDisplayComponent(sim.display, bodyComponent);
  expect(bodyDisplay instanceof Component).toBe(true);
});

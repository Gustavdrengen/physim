import { Simulation, Vec2, Draw } from "physim/base";
import { grayscaleEffect, createVignetteEffect } from "physim/effects/shaders";

const sim = new Simulation();

// Set background to something visible
sim.display.backgroundColor = "blue";

// Add a vignette effect to the display stack
const vignette = createVignetteEffect(0.6, 0.4);
sim.display.addShader(vignette);

// Add grayscale effect to the stack
sim.display.addShader(grayscaleEffect);

// Draw something using addStatic so it's processed by the shaders
sim.display.addStatic(() => {
  Draw.circle(new Vec2(800, 400), 100, "red");
  Draw.rect(new Vec2(1200, 700), 200, 200, "orange");
});

// Run the simulation
await sim.run();

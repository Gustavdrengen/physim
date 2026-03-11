import { test, expect } from "../test.ts";
import { Simulation } from "physim/base";

await test("Simulation initial state", () => {
  const simInstance = new Simulation();
  expect(simInstance.frame).toBe(0);
  expect(simInstance.time).toBe(0);
  expect(simInstance.physics).toBeTruthy();
  expect(simInstance.display).toBeTruthy();
});

await test("Simulation time tracking", () => {
  const simInstance = new Simulation();
  (simInstance as any).frame = 60;
  expect(simInstance.time).toBe(1);
  (simInstance as any).frame = 150;
  expect(simInstance.time).toBe(2.5);
});

await test("Simulation.run uses sim.run", async () => {
  const simInstance = new Simulation();
  let updated = false;

  // Mock sim.run to simulate a frame update
  (globalThis as any).sim.run = async (onUpdate: () => void) => {
    onUpdate();
  };

  await simInstance.run(() => {
    updated = true;
  });

  expect(simInstance.frame).toBe(1);
  expect(updated).toBe(true);
});

await test("Simulation autoStopTime", async () => {
  let finished = false;
  (globalThis as any).sim.finish = () => {
    finished = true;
    (globalThis as any).sim.isFinished = true; // Helper for mock run
  };

  const simInstance = new Simulation(1); // Stop after 1 second

  // Mock sim.run to simulate frames until finished
  (globalThis as any).sim.run = async (onUpdate: () => void) => {
    while (!(globalThis as any).sim.isFinished) {
      onUpdate();
    }
  };

  (simInstance as any).frame = 60;
  await simInstance.run();

  expect(finished).toBe(true);
});

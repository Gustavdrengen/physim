import { test, expect } from "../test.ts";
import { SFX } from "../src/public/sounds.ts";

await test("SFX.collision - default and manual duration", () => {
  const sDefault = SFX.collision(0.5, 0.5);
  expect(sDefault.duration).toBe(0.05 + 0.1 * 0.5);
  
  const sManual = SFX.collision(0.5, 0.5, 2.0);
  expect(sManual.duration).toBe(2.0);
});

await test("SFX.resonance - harmonic series and duration", () => {
  const s = SFX.resonance(440, 0.5, 1.5);
  expect(s.duration).toBe(1.5);
  expect(s.oscillators.length).toBe(5);
  expect(s.oscillators[0].freq).toBe(440);
  expect(s.oscillators[4].freq).toBe(440 * 5);
});

await test("SFX.friction - manual duration", () => {
  const s = SFX.friction(0.5, 0.5, 0.5);
  expect(s.duration).toBe(0.5);
  expect(s.combine).toBe("amod");
  expect(s.oscillators[0].type).toBe("brownnoise");
});

await test("SFX.vortex - structure", () => {
  const s = SFX.vortex(0.8, 0.5, 1.0);
  expect(s.duration).toBe(1.0);
  expect(s.oscillators[1].type).toBe("sine");
});

await test("SFX.electricDischarge - dynamic duration", () => {
  const s = SFX.electricDischarge(1.0);
  expect(s.duration).toBe(0.05 + 0.1 * 1.0);
  
  const sManual = SFX.electricDischarge(1.0, 5.0);
  expect(sManual.duration).toBe(5.0);
});

await test("SFX.oscillation - audible scaling", () => {
  const s = SFX.oscillation(10, 1.0, 0.3);
  expect(s.duration).toBe(0.3);
  expect(s.oscillators[0].freq).toBe(1000);
});

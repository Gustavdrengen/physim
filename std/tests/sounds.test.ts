import { test, expect } from "../test.ts";
import { SFX, Instruments } from "physim/sounds";

await test("SFX.collision - default and manual duration", () => {
  const sDefault = SFX.collision(0.5, 0.5);
  expect(sDefault.duration).toBe(0.05 + 0.1 * 0.5);

  const sManual = SFX.collision(0.5, 0.5, 2.0);
  expect(sManual.duration).toBe(2.0);
});

await test("SFX.explosion - dynamic duration", () => {
  const s = SFX.explosion(0.8);
  expect(s.duration).toBe(0.5 + 1.5 * 0.8);

  const sManual = SFX.explosion(0.8, 3.0);
  expect(sManual.duration).toBe(3.0);
});

await test("SFX.stress - structure and duration", () => {
  const s = SFX.stress(0.5);
  expect(s.duration).toBe(0.2 + 0.8 * 0.5);
  expect(s.combine).toBe("amod");
  const oscillators = s.oscillators as any[];
  expect(oscillators.length).toBe(3);
});

await test("SFX.phaseChange - structure and duration", () => {
  const s = SFX.phaseChange(0.5);
  expect(s.duration).toBe(0.05 + 0.15 * 0.5);
  expect(s.combine).toBe("product");
});

await test("SFX.resonance - Karplus-Strong pluck synthesis", () => {
  const s = SFX.resonance(440, 0.5, 1.5);
  expect(s.duration).toBe(1.5);
  expect(s.method).toBe("pluck");
  expect(s.params!.freq).toBe(440);
});

await test("SFX.friction - manual duration", () => {
  const s = SFX.friction(0.5, 0.5, 0.5);
  expect(s.duration).toBe(0.5);
  expect(s.combine).toBe("amod");
  const oscillators = s.oscillators as any[];
  expect(oscillators[0].type).toBe("brownnoise");
});

await test("SFX.vortex - structure", () => {
  const s = SFX.vortex(0.8, 0.5, 1.0);
  expect(s.duration).toBe(1.0);
  const oscillators = s.oscillators as any[];
  expect(oscillators[1].type).toBe("sine");
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
  const oscillators = s.oscillators as any[];
  expect(oscillators[0].freq).toBe(1000);
});

await test("Instruments", () => {
  expect(Instruments.PIANO).toBeTruthy();
});

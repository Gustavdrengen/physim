import { test, expect } from "../../test.ts";
import { synthToSoxArgs, type Synth } from "physim/base";

await test("synthToSoxArgs - basic sine wave", () => {
  const synth: Synth = {
    duration: 0.1,
    oscillators: { type: "sine", freq: 440 },
  };
  const args = synthToSoxArgs(synth);
  expect(args).toEqual(["synth", "0.1", "sine", "440"]);
});

await test("synthToSoxArgs - note name frequency", () => {
  const synth: Synth = {
    duration: 0.5,
    oscillators: { type: "sine", freq: "A4" },
  };
  const args = synthToSoxArgs(synth);
  expect(args).toEqual(["synth", "0.5", "sine", "440"]);
});

await test("synthToSoxArgs - frequency sweep", () => {
  const synth: Synth = {
    duration: 1.0,
    oscillators: { type: "sine", freq: [440, 880] },
  };
  const args = synthToSoxArgs(synth);
  expect(args).toEqual(["synth", "1", "sine", "440-880"]);
});

await test("synthToSoxArgs - note name sweep", () => {
  const synth: Synth = {
    duration: 0.5,
    oscillators: { type: "sine", freq: ["C4", "C5"] },
  };
  const args = synthToSoxArgs(synth);
  expect(args).toEqual(["synth", "0.5", "sine", "261.6255653005986-523.2511306011972"]);
});

await test("synthToSoxArgs - multiple oscillators with mix", () => {
  const synth: Synth = {
    duration: 0.3,
    oscillators: [
      { type: "sine", freq: 440 },
      { type: "sine", freq: 880 },
    ],
    combine: "mix",
  };
  const args = synthToSoxArgs(synth);
  expect(args).toEqual([
    "synth",
    "0.3",
    "sine",
    "440",
    "sine",
    "mix",
    "880",
  ]);
});

await test("synthToSoxArgs - trapezium waveform with extra params", () => {
  const synth: Synth = {
    duration: 0.2,
    oscillators: { type: "trapezium", freq: 440, p1: 0.25, p2: 0.5, p3: 0.75 },
  };
  const args = synthToSoxArgs(synth);
  expect(args).toEqual([
    "synth",
    "0.2",
    "trapezium",
    "440",
    "0",
    "0",
    "0.25",
    "0.5",
    "0.75",
  ]);
});

await test("synthToSoxArgs - phase parameter", () => {
  const synth: Synth = {
    duration: 0.1,
    oscillators: { type: "sine", freq: 440, phase: 50 },
  };
  const args = synthToSoxArgs(synth);
  expect(args).toEqual(["synth", "0.1", "sine", "440", "0", "50"]);
});

await test("synthToSoxArgs - partial extra params", () => {
  const synth: Synth = {
    duration: 0.1,
    oscillators: { type: "trapezium", freq: 440, p1: 0.25 },
  };
  const args = synthToSoxArgs(synth);
  expect(args).toEqual([
    "synth",
    "0.1",
    "trapezium",
    "440",
    "0",
    "0",
    "0.25",
  ]);
});

await test("synthToSoxArgs - amod combine", () => {
  const synth: Synth = {
    duration: 0.2,
    oscillators: [
      { type: "sine", freq: 440 },
      { type: "sine", freq: 1 },
    ],
    combine: "amod",
  };
  const args = synthToSoxArgs(synth);
  expect(args).toEqual([
    "synth",
    "0.2",
    "sine",
    "440",
    "sine",
    "amod",
    "1",
  ]);
});

await test("synthToSoxArgs - noise waveform", () => {
  const synth: Synth = {
    duration: 0.5,
    oscillators: { type: "noise" },
  };
  const args = synthToSoxArgs(synth);
  expect(args).toEqual(["synth", "0.5", "noise"]);
});

await test("synthToSoxArgs - invalid note format throws", () => {
  const synth: Synth = {
    duration: 0.1,
    oscillators: { type: "sine", freq: "invalid" as any },
  };
  expect(() => synthToSoxArgs(synth)).toThrow("Invalid note format: invalid");
});

await test("synthToSoxArgs - invalid note format throws", () => {
  const synth: Synth = {
    duration: 0.1,
    oscillators: { type: "sine", freq: "X4" as any },
  };
  expect(() => synthToSoxArgs(synth)).toThrow("Invalid note format: X4");
});

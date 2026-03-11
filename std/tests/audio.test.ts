import { test, expect } from "../test.ts";
import { Sound, noteEventToMidi, NoteSeries } from "physim/base";

await test("noteEventToMidi", () => {
  const event = { note: "C4", time: 1, duration: 0.5, velocity: 0.8 };
  const midi = noteEventToMidi(event);
  expect(midi.note).toBe(60); // C4 is MIDI 60
  expect(midi.time).toBe(1);
  expect(midi.duration).toBe(0.5);
  expect(midi.velocity).toBe(0.8 * 127);
});

await test("noteEventToMidi - default values", () => {
  const midi = noteEventToMidi({ note: "A4" });
  expect(midi.note).toBe(69); // A4 is MIDI 69
  expect(midi.time).toBe(0);
  expect(midi.duration).toBe(0.5);
  expect(midi.velocity).toBe(0.9 * 127);
});

await test("Sound.fromSrc and Sound.play", async () => {
  let addedProps: any = null;
  (globalThis as any).sim.addSound = async (props: any) => {
    addedProps = props;
    return 123; // Sound ID
  };

  let playedId: number = -1;
  (globalThis as any).sim.playSound = (id: number) => {
    playedId = id;
  };

  const sound = await Sound.fromSrc("test.mp3");
  expect(addedProps.src).toBe("test.mp3");
  expect(sound.id).toBe(123);

  sound.play();
  expect(playedId).toBe(123);
});

await test("NoteSeries", async () => {
  const playedIds: number[] = [];
  (globalThis as any).sim.addSound = async (props: any) => {
    return playedIds.length + 1000;
  };
  (globalThis as any).sim.playSound = (id: number) => {
    playedIds.push(id);
  };

  const series = new NoteSeries(["C4", "E4", "G4"], "font.sf2");
  await series.init();

  series.playNext(); // C4
  series.playNext(); // E4
  series.playNext(); // G4
  series.playNext(); // Loop back to C4

  expect(playedIds.length).toBe(4);
  expect(playedIds[0]).toBe(playedIds[3]);
});

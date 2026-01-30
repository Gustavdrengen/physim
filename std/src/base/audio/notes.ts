import * as SoundInterface from "../../../../sound";
import { Asset } from "../assets";
import { Sound } from "./sound";

const NOTE_MAP: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

/**
 * Represents a musical note event.
 */
export type NoteEvent = {
  /**
   * Time in seconds when the note starts.
   * @default 0
   */
  time?: number;
  /**
   * Duration of the note in seconds.
   * @default 0.5
   */
  duration?: number;
  /**
   * Note name, e.g. "C4", "A#3".
   */
  note: string;
  /**
   * Velocity of the note between 0 and 1.
   * @default 0.9
   */
  velocity?: number;
  /**
   * The MIDI channel number.
   * @default 0
   */
  channel?: number;
};

function noteNameToMidi(note: string): number {
  const match = note.match(/^([A-G](?:#|b)?)(-?\d+)$/);

  if (!match) {
    throw new Error(`Invalid note format: ${note}`);
  }

  const [, pitch, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  const noteIndex = NOTE_MAP[pitch];
  if (noteIndex === undefined) {
    throw new Error(`Unknown pitch: ${pitch}`);
  }

  const midi = (octave + 1) * 12 + noteIndex;

  if (midi < 0 || midi > 127) {
    throw new Error(`MIDI note out of range: ${midi}`);
  }

  return midi;
}

/// @internal
export function noteEventToMidi(event: NoteEvent): SoundInterface.NoteEvent {
  return {
    time: event.time || 0,
    note: noteNameToMidi(event.note),
    velocity: (event.velocity ?? 0.9) * 127,
    duration: event.duration ?? 0.5,
    channel: event.channel ?? 0,
  };
}

/**
 * A series of notes that can be played sequentially.
 */
export class NoteSeries {
  private soundsPromises: Promise<Sound>[] = [];
  private sounds?: Sound[];
  private index = 0;

  /**
   * Creates a new NoteSeries.
   * @param notes An array of note names (e.g., "C4", "A#3").
   * @param font The sound font to use for the notes.
   */
  constructor(notes: string[], font: Asset) {
    notes.forEach((note) => {
      this.soundsPromises.push(Sound.fromNote(note, font));
    });
  }

  async init() {
    this.sounds = await Promise.all(this.soundsPromises);
  }

  /**
   * Plays the next note in the series.
   * If the end of the series is reached, it loops back to the beginning.
   */
  playNext() {
    if (!this.sounds) {
      throw new Error(
        "NoteSeries not initialized. await init() before playing notes.",
      );
    }
    if (this.index >= this.soundsPromises.length) {
      this.index = 0;
    }
    this.sounds[this.index].play();
    this.index++;
  }
}

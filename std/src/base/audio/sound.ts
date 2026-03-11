import * as SoundInterface from "../../../../sound";
import * as Notes from "./notes";
import * as Synthesize from "./synthesize";
import { Asset, resolveAssetPath } from "./../assets";

/**
 * A sound that can be played.
 */
export class Sound {
  /**
   * The id of the sound.
   * @internal
   */
  id: number;

  /**
   * @internal
   */
  constructor(id: number) {
    this.id = id;
  }

  /**
   * Creates a new sound from a source.
   *
   * @param src The source of the sound.
   * @param effects Optional effects to apply to the sound.
   * @returns A promise that resolves to the new sound.
   */
  static async fromSrc(
    src: Asset,
    effects?: SoundInterface.SoundProps["effects"],
  ): Promise<Sound> {
    const path = await resolveAssetPath(src);
    const id = await sim.addSound({
      src: path,
      effects,
    });
    return new Sound(id);
  }

  /**
   * Creates a new sound from a MIDI file or inline note events with a soundfont.
   *
   * @param midi The MIDI file path or inline note events.
   * @param soundfont The soundfont path.
   * @param effects Optional effects to apply to the sound.
   * @returns A promise that resolves to the new sound.
   */
  static async fromMIDI(
    midi: Asset | Notes.NoteEvent[],
    soundfont: Asset,
    effects?: SoundInterface.SoundProps["effects"],
  ): Promise<Sound> {
    const fontPath = await resolveAssetPath(soundfont);
    let midiSrc: string | SoundInterface.NoteEvent[];

    if (Array.isArray(midi)) {
      midiSrc = midi.map((e) => Notes.noteEventToMidi(e));
    } else {
      midiSrc = await resolveAssetPath(midi);
    }

    const id = await sim.addSound({
      src: {
        midi: midiSrc,
        soundfont: fontPath,
      },
      effects,
    });
    return new Sound(id);
  }

  /**
   * Creates a new sound from a single note.
   *
   * @param note The note name (e.g. "C4").
   * @param font The soundfont to use.
   * @param effects Optional effects to apply to the sound.
   * @returns A promise that resolves to the new sound.
   */
  static fromNote(
    note: string,
    font: Asset,
    effects?: SoundInterface.SoundProps["effects"],
  ): Promise<Sound> {
    return Sound.fromMIDI(
      [
        {
          note,
        },
      ],
      font,
      effects,
    );
  }

  /**
   * Creates a new sound using synthesis from raw arguments.
   *
   * @param args The arguments to pass to the synthesis engine.
   * @param effects Optional effects to apply to the sound.
   * @returns A promise that resolves to the new sound.
   */
  static async fromRawSynth(
    args: string[],
    effects?: SoundInterface.SoundProps["effects"],
  ): Promise<Sound> {
    const id = await sim.addSound({
      src: {
        args,
      },
      effects,
    });
    return new Sound(id);
  }

  /**
   * Creates a new sound using synthesis from raw arguments to the SoX command line tool.
   * @see {@link https://linux.die.net/man/1/sox} for the SoX CLI documentation and available options.
   *
   * @param args The arguments to pass to the synthesis engine.
   * @param effects Optional effects to apply to the sound.
   * @returns A promise that resolves to the new sound.
   */
  static fromSynth(
    synth: Synthesize.Synth,
    effects?: SoundInterface.SoundProps["effects"],
  ): Promise<Sound> {
    return Sound.fromRawSynth(Synthesize.synthToSoxArgs(synth), effects);
  }

  /**
   * Plays the sound.
   */
  play() {
    sim.playSound(this.id);
  }
}

import * as SoundInterface from "../../../../sound";
import * as Notes from "./notes";
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
   * @returns A promise that resolves to the new sound.
   */
  static fromSrc(src: Asset): Promise<Sound> {
    return new SoundBuilder().setFile(src).build();
  }

  static fromNote(note: string, font: Asset): Promise<Sound> {
    return new SoundBuilder()
      .setMIDI(
        [
          {
            note,
          },
        ],
        font,
      )
      .build();
  }

  /**
   * Plays the sound.
   */
  play() {
    sim.playSound(this.id);
  }
}

/**
 * A builder for sounds.
 */
export class SoundBuilder {
  private resolveBeforeBuild: Promise<void>[] = [];
  private props: SoundInterface.SoundProps;

  /**
   * Creates a new sound builder.
   */
  constructor() {
    this.props = { src: null! };
  }

  /**
   * Sets the source of the sound to a file path.
   *
   * @param src The source file of the sound.
   * @returns The sound builder.
   */
  setFile(src: Asset): SoundBuilder {
    this.resolveBeforeBuild.push(
      resolveAssetPath(src).then((path) => {
        this.props.src = path;
      }),
    );
    return this;
  }

  /**
   * Sets the source of the sound to a MIDI file or inline note events with a soundfont.
   *
   * @param midi The MIDI file path or inline note events.
   * @param soundfont The soundfont path.
   * @returns The sound builder.
   */
  setMIDI(midi: Asset | Notes.NoteEvent[], soundfont: Asset): SoundBuilder {
    const fontPromise = resolveAssetPath(soundfont);
    let midiPromise: Promise<string | SoundInterface.NoteEvent[]>;

    if (Array.isArray(midi)) {
      midiPromise = Promise.resolve(midi.map((e) => Notes.noteEventToMidi(e)));
    } else {
      midiPromise = resolveAssetPath(midi);
    }

    const fullPromise = Promise.all([midiPromise, fontPromise]).then(
      ([resolvedMIDI, resolvedFont]) => {
        this.props.src = { midi: resolvedMIDI, soundfont: resolvedFont };
      },
    );

    this.resolveBeforeBuild.push(fullPromise);

    return this;
  }

  addEffectRaw(arg: string, value: string | number | boolean): SoundBuilder {
    if (!this.props.effects) {
      this.props.effects = {};
    }
    this.props.effects[arg] = value;
    return this;
  }

  /**
   * Builds the sound.
   *
   * @returns A promise that resolves to the new sound.
   */
  async build(): Promise<Sound> {
    await Promise.all(this.resolveBeforeBuild);
    if (this.props.src == null) {
      throw new Error("Sound source is not set");
    }
    return new Sound(await sim.addSound(this.props));
  }
}

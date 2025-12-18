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
  static fromSrc(src: string): Promise<Sound> {
    return new SoundBuilder(src).build();
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
  /**
   * The source of the sound.
   */
  src: string;

  /**
   * Creates a new sound builder.
   *
   * @param src The source of the sound.
   */
  constructor(src: string) {
    this.src = src;
  }

  /**
   * Builds the sound.
   *
   * @returns A promise that resolves to the new sound.
   */
  async build(): Promise<Sound> {
    return new Sound(await sim.addSound(this));
  }
}

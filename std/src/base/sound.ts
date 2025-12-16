export class Sound {
  id: number;

  constructor(id: number) {
    this.id = id;
  }

  static fromSrc(src: string): Promise<Sound> {
    return new SoundBuilder(src).build();
  }

  play() {
    sim.playSound(this.id);
  }
}

export class SoundBuilder {
  src: string;

  constructor(src: string) {
    this.src = src;
  }

  async build(): Promise<Sound> {
    return new Sound(await sim.addSound(this));
  }
}

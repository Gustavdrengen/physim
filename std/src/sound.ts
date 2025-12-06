import { Howl } from "howler";

export class Sound {
  private howl: Howl;
  constructor(src: string) {
    this.howl = new Howl({
      src: [src],
    });
  }

  play() {
    this.howl.play;
  }
}

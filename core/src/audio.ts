import { AssetManager } from "./assets.ts";
import { addAudioToMp4, playMP3, synthMidi } from "./audioProcessing.ts";
import { join } from "@std/path";
import { fail, failed, InputFailureTag, Result } from "./err.ts";

type SoundProps = {
  src: string;
};

type Sound = string;

export class AudioPlayer {
  playLoud: boolean;
  sounds: Sound[] = [];
  soundLog: [number, Sound][] = [];
  tmpDir: string;
  assetManager: AssetManager;

  constructor(playLoud: boolean, tmpDir: string, assetManager: AssetManager) {
    this.playLoud = playLoud;
    this.tmpDir = tmpDir;
    this.assetManager = assetManager;
  }

  async addSound(props: SoundProps): Promise<Result<number>> {
    const fileName = join(this.tmpDir, "sound_" + this.sounds.length + ".mp3");

    if (typeof props.src === "string") {
      const r = this.assetManager.copyAsset(props.src, fileName);
      if (r) {
        return r;
      }
    } else {
      let midi = props.src.midi;
      if (typeof midi === "string") {
        midi = this.assetManager.resolveAssetPath(midi);
        if (failed(midi)) {
          return midi;
        }
      }
      let fontPath = this.assetManager.resolveAssetPath(props.src.soundfont);
      if (failed(fontPath)) {
        return fontPath as Result<number>;
      }
      const r = await synthMidi(midi, fontPath as string, fileName);
      if (r) {
        return r;
      }
    }

    return this.sounds.push(fileName) - 1;
  }

  playSound(id: number, frame: number): Result<undefined> {
    if (this.sounds[id] === undefined) {
      return fail(
        InputFailureTag.SoundFailure,
        `Undefined sound with id: ${id}`,
      );
    }

    const sound = this.sounds[id];
    this.soundLog.push([frame, sound]);
    playMP3(sound);
  }

  addAudioToVideo(videoPath: string): Promise<Result<undefined>> {
    return addAudioToMp4(this.soundLog, videoPath, 60);
  }
}

import { AssetManager } from "./assets.ts";
import { addAudioToMp4, playMP3 } from "./audioProcessing.ts";
import { join } from "@std/path";
import { fail, InputFailureTag, Result } from "./err.ts";

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

  addSound(props: SoundProps): Result<number> {
    const fileName = join(this.tmpDir, "sound_" + this.sounds.length + ".mp3");

    const r = this.assetManager.copyAsset(props.src, fileName);
    if (r) {
      return r;
    }

    return this.sounds.push(fileName) - 1;
  }

  playSound(id: number, frame: number): Result<undefined> {
    if (this.sounds[id] === undefined) {
      return fail(InputFailureTag.SoundFailure, `Undefined sound with id: ${id}`);
    }

    const sound = this.sounds[id];
    this.soundLog.push([frame, sound]);
    playMP3(sound);
  }

  addAudioToVideo(videoPath: string): Promise<Result<undefined>> {
    return addAudioToMp4(this.soundLog, videoPath, 60);
  }
}

import { AssetManager } from "../assets.ts";
import { SoundProps } from "../../../../sound.ts";
import { addAudioToMp4 } from "./mp4.ts";
import { synthMidi } from "./midi.ts";
import { synthSox } from "./sox.ts";
import { join } from "@std/path";
import {
  fail,
  failed,
  InputFailureTag,
  Result,
} from "../../err.ts";
import { playAudio } from "../../rust.ts";

type Sound = string;

export class AudioPlayer {
  playLoud: boolean;
  enabled: boolean;
  sounds: Sound[] = [];
  soundLog: [number, Sound][] = [];
  tmpDir: string;
  assetManager: AssetManager;
  currentFrame: number = 0;
  playedThisFrame: Set<number> = new Set();

  constructor(
    playLoud: boolean,
    enabled: boolean,
    tmpDir: string,
    assetManager: AssetManager,
  ) {
    this.playLoud = playLoud;
    this.enabled = enabled;
    this.tmpDir = tmpDir;
    this.assetManager = assetManager;
  }

  async addSound(props: SoundProps): Promise<Result<number>> {
    const id = this.sounds.length;
    this.sounds.push("");

    if (!this.enabled) {
      return id;
    }

    const fileName = join(this.tmpDir, "sound_" + id + ".wav");

    if (typeof props.src === "string") {
      const r = this.assetManager.copyAsset(props.src, fileName);
      if (r) {
        return r;
      }
    } else if ("midi" in props.src) {
      let midi = props.src.midi;
      if (typeof midi === "string") {
        const resolved = this.assetManager.resolveAssetPath(midi);
        if (failed(resolved)) {
          return resolved as Result<number>;
        }
        midi = resolved as string;
      }
      const fontPath = this.assetManager.resolveAssetPath(props.src.soundfont);
      if (failed(fontPath)) {
        return fontPath as Result<number>;
      }
      const r = await synthMidi(midi, fontPath as string, fileName);
      if (r) {
        return r;
      }
    } else if ("args" in props.src) {
      const r = await synthSox(props.src.args, fileName);
      if (r) {
        return r;
      }
    }

    this.sounds[id] = fileName;
    return id;
  }

  playSound(id: number, frame: number): Result<undefined> {
    if (!this.enabled) {
      return;
    }

    if (this.currentFrame !== frame) {
      this.currentFrame = frame;
      this.playedThisFrame.clear();
    }

    if (this.playedThisFrame.has(id)) {
      return;
    }

    if (this.sounds[id] === undefined) {
      return fail(
        InputFailureTag.SoundFailure,
        `Undefined sound with id: ${id}`,
      );
    }

    this.playedThisFrame.add(id);

    const sound = this.sounds[id];
    this.soundLog.push([frame, sound]);

    if (this.playLoud) {
      const r = playAudio(sound);
      if (failed(r)) {
        return r;
      }
    }
  }

  addAudioToVideo(videoPath: string): Promise<Result<undefined>> {
    if (!this.enabled || this.soundLog.length === 0) {
      return Promise.resolve(undefined as unknown as Result<undefined>);
    }
    return addAudioToMp4(this.soundLog, videoPath, 60);
  }
}

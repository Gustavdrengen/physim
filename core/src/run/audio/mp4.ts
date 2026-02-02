import { fail, Result, SystemFailureTag } from "../../err.ts";

export async function addAudioToMp4(
  clips: [number, string][],
  mp4Path: string,
  framerate: number,
): Promise<Result<undefined>> {
  const validClips: { frame: number; path: string }[] = [];
  for (const item of clips) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const frame = Number(item[0]);
    const path = String(item[1]);
    if (!Number.isFinite(frame) || frame < 0) continue;
    try {
      await Deno.stat(path);
    } catch {
      return fail(
        SystemFailureTag.FfmpegFailure,
        `Clip file not found: ${path}`,
      );
    }
    validClips.push({ frame, path });
  }

  if (validClips.length === 0) {
    return fail(SystemFailureTag.FfmpegFailure, "No valid clips provided");
  }

  try {
    await Deno.stat(mp4Path);
  } catch {
    return fail(
      SystemFailureTag.FfmpegFailure,
      `MP4 file not found: ${mp4Path}`,
    );
  }

  async function mp4HasAudio(path: string): Promise<boolean> {
    const probe = new Deno.Command("ffprobe", {
      args: [
        "-v",
        "error",
        "-select_streams",
        "a",
        "-show_entries",
        "stream=index",
        "-of",
        "csv=p=0",
        path,
      ],
      stdout: "piped",
      stderr: "null",
    });
    const { code, stdout } = await probe.output();
    if (code !== 0) {
      return false;
    }
    const txt = new TextDecoder().decode(stdout).trim();
    return txt.length > 0;
  }

  const hasAudio = await mp4HasAudio(mp4Path);

  const args: string[] = ["-y", "-i", mp4Path];
  for (const clip of validClips) args.push("-i", clip.path);

  const filterParts: string[] = [];
  const delayedLabels: string[] = [];
  for (let i = 0; i < validClips.length; i++) {
    const { frame } = validClips[i];
    const startMs = Math.round((frame / framerate) * 1000);
    const inputIndex = i + 1;
    const label = `a${i}`;
    filterParts.push(`[${inputIndex}:a]adelay=${startMs}:all=1[${label}]`);
    delayedLabels.push(`[${label}]`);
  }

  const audioSources: string[] = [];
  if (hasAudio) audioSources.push("[0:a]");
  audioSources.push(...delayedLabels);

  let finalAudioLabel = "";
  if (audioSources.length === 1) {
    finalAudioLabel = audioSources[0];
  } else {
    const inputsCount = audioSources.length;
    filterParts.push(
      `${audioSources.join("")}amix=inputs=${inputsCount}:duration=longest[aout]`,
    );
    finalAudioLabel = "[aout]";
  }

  const filterComplex = filterParts.join(";");

  const tmpOutput = `${mp4Path}.with_added_audio.tmp.mp4`;

  args.push("-filter_complex", filterComplex);
  args.push("-map", "0:v");
  args.push("-map", finalAudioLabel);
  args.push("-c:v", "copy", "-c:a", "aac", "-b:a", "192k", tmpOutput);

  try {
    const ff = new Deno.Command("ffmpeg", {
      args,
    });

    const { code } = await ff.output();
    if (code !== 0) {
      try {
        await Deno.remove(tmpOutput);
      } catch {
        //
      }
      return fail(
        SystemFailureTag.FfmpegFailure,
        `ffmpeg exited with code ${code}`,
      );
    }

    const backupPath = `${mp4Path}.bak.${Date.now()}`;
    try {
      await Deno.rename(mp4Path, backupPath);
      await Deno.rename(tmpOutput, mp4Path);
      await Deno.remove(backupPath);
    } catch (err) {
      try {
        const statBackup = await Deno.stat(backupPath).catch(() => null);
        if (statBackup) {
          try {
            await Deno.remove(tmpOutput).catch(() => {});
          } catch {
            //
          }
          await Deno.rename(backupPath, mp4Path);
        }
      } catch {
        //
      }
      return fail(
        SystemFailureTag.FfmpegFailure,
        `Failed to replace MP4: ${String(err)}`,
      );
    }
  } catch (err) {
    return fail(
      SystemFailureTag.FfmpegFailure,
      `Unexpected error: ${String(err)}`,
    );
  }

  return undefined as unknown as Result<undefined>;
}

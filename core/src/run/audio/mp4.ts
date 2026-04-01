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

  const uniquePaths = [...new Set(validClips.map(c => c.path))];

  const intermediateFiles: string[] = [];
  const cleanupIntermediates = async () => {
    for (const f of intermediateFiles) {
      try {
        await Deno.remove(f);
      } catch {
      }
    }
  };

  for (let pathIdx = 0; pathIdx < uniquePaths.length; pathIdx++) {
    const path = uniquePaths[pathIdx]!;
    const clipsForPath = validClips.filter(c => c.path === path);

    if (clipsForPath.length === 0) continue;

    const args: string[] = ["-y", "-i", path];

    const filterParts: string[] = [];
    const delayedLabels: string[] = [];
    for (let i = 0; i < clipsForPath.length; i++) {
      const clip = clipsForPath[i]!;
      const startMs = Math.round((clip.frame / framerate) * 1000);
      const label = `a${i}`;
      filterParts.push(`[0:a]adelay=${startMs}:all=1[${label}]`);
      delayedLabels.push(`[${label}]`);
    }

    const filterComplex = filterParts.join(";") + ";" + delayedLabels.join("") + `amix=inputs=${clipsForPath.length}:duration=longest[out${pathIdx}]`;
    const filterScriptPath = `/tmp/physim_audio_filter_${pathIdx}.txt`;
    await Deno.writeTextFile(filterScriptPath, filterComplex);

    const outputPath = `/tmp/physim_audio_intermediate_${pathIdx}.wav`;
    intermediateFiles.push(outputPath);

    args.push("-filter_complex_script", filterScriptPath);
    args.push("-map", `[out${pathIdx}]`);
    args.push("-c:a", "pcm_s16le", outputPath);

    const ff = new Deno.Command("ffmpeg", { args });
    const { code } = await ff.output();

    try {
      await Deno.remove(filterScriptPath);
    } catch {
    }

    if (code !== 0) {
      await cleanupIntermediates();
      return fail(
        SystemFailureTag.FfmpegFailure,
        `ffmpeg intermediate mix ${pathIdx} exited with code ${code}`,
      );
    }
  }

  const finalArgs: string[] = ["-y", "-i", mp4Path];
  for (let i = 0; i < intermediateFiles.length; i++) {
    finalArgs.push("-i", intermediateFiles[i]!);
  }

  const audioInputs: string[] = [];
  for (let i = 0; i < intermediateFiles.length; i++) {
    audioInputs.push(`[${i + 1}:a]`);
  }

  if (hasAudio) {
    audioInputs.unshift("[0:a]");
  }

  const finalFilterComplex = `${audioInputs.join("")}amix=inputs=${audioInputs.length}:duration=longest[aout]`;
  const finalFilterScriptPath = "/tmp/physim_audio_final_filter.txt";
  await Deno.writeTextFile(finalFilterScriptPath, finalFilterComplex);

  finalArgs.push("-filter_complex_script", finalFilterScriptPath);
  finalArgs.push("-map", "0:v");
  finalArgs.push("-map", "[aout]");
  finalArgs.push("-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "/tmp/physim_audio_final.mp4");

  const ff2 = new Deno.Command("ffmpeg", { args: finalArgs });
  const { code: code2 } = await ff2.output();

  try {
    await Deno.remove(finalFilterScriptPath);
  } catch {
  }

  if (code2 !== 0) {
    try {
      await Deno.remove("/tmp/physim_audio_final.mp4");
    } catch {
    }
    await cleanupIntermediates();
    return fail(
      SystemFailureTag.FfmpegFailure,
      `ffmpeg final mix exited with code ${code2}`,
    );
  }

  const backupPath = `${mp4Path}.bak.${Date.now()}`;
  try {
    await Deno.rename(mp4Path, backupPath);
    await Deno.rename("/tmp/physim_audio_final.mp4", mp4Path);
    await Deno.remove(backupPath);
  } catch (err) {
    try {
      const statBackup = await Deno.stat(backupPath).catch(() => null);
      if (statBackup) {
        try {
          await Deno.remove("/tmp/physim_audio_final.mp4").catch(() => {});
        } catch {
        }
        await Deno.rename(backupPath, mp4Path);
      }
    } catch {
    }
    await cleanupIntermediates();
    return fail(
      SystemFailureTag.FfmpegFailure,
      `Failed to replace MP4: ${String(err)}`,
    );
  }

  await cleanupIntermediates();

  return undefined as unknown as Result<undefined>;
}

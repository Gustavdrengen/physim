import { dirname } from "@std/path";
import { buildSimulation } from "./build.ts";
import { Result } from "./err.ts";
import { runServer } from "./serve.ts";
import { AssetManager } from "./assets.ts";
import { AudioPlayer } from "./audio.ts";
import * as print from "./print.ts";

export async function compileVideo(tempDirName: string, outfile: string) {
  const command = new Deno.Command("ffmpeg", {
    args: [
      "-y",
      "-framerate",
      "60",
      "-i",
      tempDirName + "/frame%05d.png",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      outfile,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  return {
    success: code === 0,
    code,
    stdout,
    stderr,
  };
}

export async function run(
  entrypoint: string,
  raw: boolean,
  record: string | undefined,
): Promise<Result<undefined>> {
  const tempDirName = await Deno.makeTempDir();
  const outfile = `${tempDirName}/out.js`;

  const r = await buildSimulation(entrypoint, outfile);
  if (r) {
    Deno.remove(tempDirName, { recursive: true });
    return r;
  }

  const assetManager = new AssetManager(dirname(entrypoint), tempDirName);
  const audioPlayer = new AudioPlayer(true, tempDirName, assetManager);
  const runResult = await runServer(
    outfile,
    tempDirName,
    !!raw,
    record !== undefined,
    assetManager,
    audioPlayer,
  );

  if (runResult) {
    Deno.remove(tempDirName, { recursive: true });
    return runResult;
  }

  if (record !== undefined) {
    if (!raw) {
      print.info("Generating video...");
    }

    const result = await compileVideo(tempDirName, record);

    if (result.code !== 0) {
      // TODO: Handle properly
      console.error("FFMPEG ERROR:", result.stderr.toString());
    }

    const r = await audioPlayer.addAudioToVideo(record);
    if (r) {
      Deno.remove(tempDirName, { recursive: true });
      return r;
    }
  }
  Deno.remove(tempDirName, { recursive: true });
}

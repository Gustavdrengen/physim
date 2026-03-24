import { dirname } from "@std/path";
import { buildSimulation } from "./build.ts";
import { Result } from "../err.ts";
import { runServer } from "./serve.ts";
import { AssetManager } from "./assets.ts";
import { AudioPlayer } from "./audio/mod.ts";
import { fail, InputFailureTag } from "../err.ts";
import * as print from "../print.ts";

export async function run(
  entrypoint: string,
  record: string | undefined,
  useWebview: boolean,
  noAudio: boolean,
): Promise<Result<undefined>> {
  try {
    if (!(await Deno.stat(entrypoint)).isFile) {
      return fail(
        InputFailureTag.EntryPointNotFoundFailure,
        `Entrypoint not a file: ${entrypoint}`,
      );
    }
  } catch {
    return fail(
      InputFailureTag.EntryPointNotFoundFailure,
      `Entrypoint not found: ${entrypoint}`,
    );
  }

  const tempDirName = await Deno.makeTempDir();
  const outfile = `${tempDirName}/out.js`;

  const r = await buildSimulation(entrypoint, outfile);
  if (r) {
    Deno.remove(tempDirName, { recursive: true });
    return r;
  }

  const assetManager = new AssetManager(dirname(entrypoint), tempDirName);
  const playAudio = !noAudio;
  const audioEnabled = playAudio || (record !== undefined);
  const audioPlayer = new AudioPlayer(
    playAudio,
    audioEnabled,
    tempDirName,
    assetManager,
  );
  const runResult = await runServer(
    outfile,
    tempDirName,
    record,
    assetManager,
    audioPlayer,
    useWebview,
  );

  if (runResult) {
    Deno.remove(tempDirName, { recursive: true });
    return runResult;
  }

  if (record !== undefined) {
    print.info("Adding audio to video...");
    const r = await audioPlayer.addAudioToVideo(record);
    if (r) {
      Deno.remove(tempDirName, { recursive: true });
      return r;
    }
  }
  Deno.remove(tempDirName, { recursive: true });
}

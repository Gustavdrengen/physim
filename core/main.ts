import { Command } from "@cliffy/command";
import { buildSimulation } from "./build.ts";
import { runServer } from "./serve.ts";
import { init } from "./init.ts";
import { checkTscInstalled, installTscIfAllowed } from "./tsc.ts";

if (!await checkTscInstalled()) {
  if (!installTscIfAllowed()) {
    console.error("TypeScript (tsc) installation failed. Exiting.");
    Deno.exit(1);
  }
}

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

const cmd = new Command()
  .name("physim")
  .version("0.1.0")
  .description("Highly advanded physics simulation system")
  .action(() => {
    cmd.showHelp();
  })
  .command("run <entrypoint>", "Runs a simulation from a JS/TS file")
  .option("--raw", "Only prints raw logs if the simulation finishes")
  .option("-r --record <outfile>", "Record the simulation and save it as an mp4 in outfile.")
  .action(async ({ raw, record }, entrypoint) => {
    const tempDirName = await Deno.makeTempDir();
    const outfile = `${tempDirName}/out.js`;
    buildSimulation(entrypoint, outfile);
    const exitCode = await runServer(outfile, tempDirName, !!raw, record != undefined);
    if (record != undefined && exitCode == 0) {
      if (!raw) {
        console.log("Generating video...");
      }
      const result = compileVideo(tempDirName, record);
      if ((await result).code != 0) {
        console.error("FFMPEG ERROR:", (await result).stderr.toString());
      }
    }
    Deno.remove(tempDirName);
    Deno.exit(exitCode);
  })
  .command("init", "Adds typescript configuration to the current directory")
  .action(async () => {
    await init();
    console.log("Generated tsconfig.json");
  });

await cmd.parse(Deno.args);

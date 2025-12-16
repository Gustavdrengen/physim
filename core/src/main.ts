import { Command } from "@cliffy/command";
import { init } from "./init.ts";
import { checkTscInstalled, installTscIfAllowed } from "./tsc.ts";
import { setGlobalErrorHandler, unwrap } from "./err.ts";
import { run } from "../run.ts";

setGlobalErrorHandler();

if (!await checkTscInstalled()) {
  if (!installTscIfAllowed()) {
    console.error("TypeScript (tsc) installation failed. Exiting.");
    Deno.exit(1);
  }
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
    unwrap(await run(entrypoint, !!raw, record));
  })
  .command("init", "Adds typescript configuration to the current directory")
  .action(async () => {
    await init();
    console.log("Generated tsconfig.json");
  });

await cmd.parse(Deno.args);

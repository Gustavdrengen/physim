import { Command } from "@cliffy/command";
import { buildSimulation } from "./build.ts";
import { startServer } from "./serve.ts";
import { init } from "./init.ts";
import { checkTscInstalled, installTscIfAllowed } from "./tsc.ts";

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
  .command("open <entrypoint>", "Opens a simulation from a JS/TS file")
  .action(async (_, entrypoint) => {
    const tempDirName = await Deno.makeTempDir();
    const outfile = `${tempDirName}/out.js`;
    buildSimulation(entrypoint, outfile);
    startServer(outfile);
    Deno.remove(tempDirName);
  })
  .command("init", "Adds typescript configuration to the current directory")
  .action(async () => {
    await init();
    console.log("Generated tsconfig.json");
  });

await cmd.parse(Deno.args);

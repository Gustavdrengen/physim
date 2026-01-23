import { Command } from "@cliffy/command";
import { init } from "./init.ts";
import { checkTscInstalled, installTscIfAllowed } from "./tsc.ts";
import { enableRawMode, setGlobalErrorHandler, unwrap } from "./err.ts";
import { run } from "./run.ts";
import { dirname, fromFileUrl, join } from "@std/path";
import { genDocs } from "./docs.ts";
import * as print from "./print.ts";

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
    if (raw) {
      enableRawMode();
    }
    unwrap(await run(entrypoint, !!raw, record));
  })
  .command("init", "Adds typescript configuration to the current directory")
  .action(async () => {
    await init();
    print.raw("Generated tsconfig.json");
  })
  .command("docs", "Generates and/or serves the standard library documentation.")
  .option("-s --serve", "Host the documentation locally.")
  .option("--html", "Generate html documentation.")
  .option("--markdown", "Generate markdown documentation.")
  .option(
    "--print-md-path",
    "The only output of the command will be the path to the markdown documentation. Useful for automation.",
  )
  .action(async ({ serve, html, markdown, printMdPath }) => {
    await genDocs(!!serve, !!html, !!markdown, !!printMdPath);
  }).command("install-python", "Provides instructions for installing the Physim python package")
  .action(() => {
    const scriptDir = dirname(fromFileUrl(import.meta.url));
    const pythonPackagePath = join(scriptDir, "..", "..", "python-package");
    print.raw(`The python package is located at: ${pythonPackagePath}`);
    print.raw("In can be installed on most systems using pip:");
    print.raw(`pip install ${pythonPackagePath}`);
    print.raw("It can be updated using:");
    print.raw(`pip uninstall physim && pip install ${pythonPackagePath}`);
    print.raw("Installation methods may vary based on your system and python environment.");
  });

await cmd.parse(Deno.args);

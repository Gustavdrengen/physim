import { Command } from "@cliffy/command";
import { init } from "./init.ts";
import { checkTscInstalled, installTscIfAllowed } from "./tsc.ts";
import { setGlobalErrorHandler, unwrap } from "./err.ts";
import { run } from "./run.ts";
import { dirname, extname, fromFileUrl, join } from "@std/path";
import { contentType } from "https://deno.land/std@0.201.0/media_types/mod.ts";

setGlobalErrorHandler();

if (!await checkTscInstalled()) {
  if (!installTscIfAllowed()) {
    console.error("TypeScript (tsc) installation failed. Exiting.");
    Deno.exit(1);
  }
}

export function serveDirectory(dir: string, port = 8000) {
  Deno.serve({ port }, async (req) => {
    try {
      const url = new URL(req.url);
      let filePath = join(dir, decodeURIComponent(url.pathname));

      try {
        const stat = await Deno.stat(filePath);
        if (stat.isDirectory) {
          filePath = join(filePath, "index.html");
        }
      } catch {
        // file does not exist, will return 404 later
      }

      const data = await Deno.readFile(filePath);
      const ext = extname(filePath);
      const mime = contentType(ext) || "application/octet-stream";

      return new Response(data, {
        status: 200,
        headers: { "content-type": mime },
      });
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  });
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
  })
  .command("docs", "Generates and/or serves the standard library documentation.")
  .option("-s --serve", "Host the documentation locally.")
  .option("--html", "Generate html documentation.")
  .option("--markdown", "Generate markdown documentation.")
  .action(async ({ serve, html, markdown }) => {
    const scriptDir = dirname(fromFileUrl(import.meta.url));
    const stdDirPath = join(scriptDir, "..", "..", "std");
    const docsDirPath = join(stdDirPath, "docs");
    const docsBinDirPath = join(docsDirPath, "bin");

    await Deno.mkdir(docsBinDirPath, { recursive: true });

    async function runWithOptions(opt: string) {
      const cmd = new Deno.Command("npx", {
        args: [
          "typedoc",
          "--options",
          opt,
        ],
        cwd: stdDirPath,
      });
      const { code } = await cmd.output();

      if (code !== 0) {
        throw new Error(`TypeDoc exited with code ${code}`);
      }
    }

    if (html) {
      // html docs is for advanced docs intended for humans
      await runWithOptions("typedoc-html.json");
      console.log(`Saved html documentation to ${join(docsBinDirPath, "html")}`);
    }

    if (markdown) {
      // markdown docs is for plain docs intended for pure-text consumption (like llm's). It should still contain all info
      await runWithOptions("typedoc-md.json");
      console.log(`Saved markdown documentation to ${join(docsBinDirPath, "md")}`);
    }

    if (serve) {
      const PORT = 6767;
      console.log(`Serving documentation at http://localhost:${PORT}/`);
      serveDirectory(docsDirPath, PORT);
    }
  });

await cmd.parse(Deno.args);

import { dirname, fromFileUrl, join } from "@std/path";
import { serveDir } from "@std/http";
import * as print from "./print.ts";
import { openUrl } from "./open.ts";

const PORT = 6767;

const scriptDir = dirname(fromFileUrl(import.meta.url));
const stdDirPath = join(scriptDir, "..", "..", "std");
const docsDirPath = join(stdDirPath, "docs");
const docsBinDirPath = join(docsDirPath, "bin");

function serveDocs() {
  Deno.serve({ port: PORT }, (req) => {
    return serveDir(req, {
      fsRoot: docsDirPath,
      showDirListing: true,
      showIndex: true,
    });
  });
}

async function runWithOptions(opt: string) {
  const cmd = new Deno.Command("npx", {
    args: ["typedoc", "--options", opt],
    cwd: stdDirPath,
  });

  const { code } = await cmd.output();

  if (code !== 0) {
    throw new Error(`TypeDoc exited with code ${code}`);
  }
}

export async function genDocs(
  serve: boolean,
  open: boolean,
  html: boolean,
  markdown: boolean,
  printMdPath: boolean,
) {
  await Deno.mkdir(docsBinDirPath, { recursive: true });

  if (html) {
    // html docs is for advanced docs intended for humans
    await runWithOptions("typedoc-html.json");
    if (!printMdPath) {
      print.raw(`Saved html documentation to ${join(docsBinDirPath, "html")}`);
    }
  }

  if (markdown) {
    // markdown docs is for plain docs intended for pure-text consumption (like llm's). It should still contain all info
    await runWithOptions("typedoc-md.json");
    if (!printMdPath) {
      print.raw(
        `Saved markdown documentation to ${join(docsBinDirPath, "md")}`,
      );
    }
  }

  if (serve) {
    if (!printMdPath) {
      print.raw(`Serving documentation at http://127.0.0.1:${PORT}`);
    }
    serveDocs();
    if (open) {
      openUrl(`http://127.0.0.1:${PORT}`);
    }
  }

  if (printMdPath) {
    print.raw(join(docsBinDirPath, "md"));
  }
}

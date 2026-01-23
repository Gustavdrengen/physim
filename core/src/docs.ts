import { dirname, extname, fromFileUrl, join } from "@std/path";
import { contentType } from "@std/media-types";
import * as print from "./print.ts";

const scriptDir = dirname(fromFileUrl(import.meta.url));
const stdDirPath = join(scriptDir, "..", "..", "std");
const docsDirPath = join(stdDirPath, "docs");
const docsBinDirPath = join(docsDirPath, "bin");

function serveDirectory(dir: string, port = 8000) {
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

export async function genDocs(
  serve: boolean,
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
      print.raw(`Saved markdown documentation to ${join(docsBinDirPath, "md")}`);
    }
  }

  if (serve) {
    const PORT = 6767;
    if (!printMdPath) {
      print.raw(`Serving documentation at http://localhost:${PORT}/`);
    }
    serveDirectory(docsDirPath, PORT);
  }

  if (printMdPath) {
    print.raw(join(docsBinDirPath, "md"));
  }
}

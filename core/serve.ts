import { dirname, fromFileUrl, join } from "@std/path";

const ac = new AbortController();

const PORT = 8080;

const scriptDir = dirname(fromFileUrl(import.meta.url));
const htmlPath = join(scriptDir, "sim.html");
const jsPath = join(scriptDir, "sim.js");

const htmlContentRaw = await Deno.readTextFile(htmlPath);
const jsContent = await Deno.readTextFile(jsPath);
let htmlContent = htmlContentRaw.replace("//JS", jsContent);

let logs: string[] = [];
let frame = 0;

export async function runServer(
  bundle: string,
  tempDirName: string,
  raw: boolean,
  record: boolean,
): Promise<number> {
  if (record) {
    htmlContent = htmlContent.replace("SHOULD_RECORD", "true");
  } else {
    htmlContent = htmlContent.replace("SHOULD_RECORD", "false");
  }

  let exitCode = 0;

  await Deno.serve({
    signal: ac.signal,
    hostname: "127.0.0.1",
    port: PORT,
    onListen({ port, hostname }) {
      if (!raw) {
        console.log(`Server started at http://${hostname}:${port}/`);
      }
    },
  }, async (req) => {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(htmlContent, {
        headers: { "Content-Type": "text/html" },
      });
    } else if (url.pathname === "/bundle.js") {
      return new Response(await Deno.readFile(bundle), {
        headers: { "Content-Type": "text/javascript" },
      });
    } else if (url.pathname === "/out.js.map") {
      return new Response(await Deno.readFile(bundle + ".map"), {
        headers: { "Content-Type": "text/javascript" },
      });
    } else if (url.pathname === "/begin") {
      logs = [];
      frame = 0;
      if (!raw) {
        console.info("Simulation started");
      }
      return new Response("Ok", { status: 200 });
    } else if (url.pathname === "/log") {
      if (req.body) {
        if (raw) {
          logs.push(await req.text());
        } else {
          console.log("[LOG]:", await req.text());
        }
      }
      return new Response("Logged", { status: 200 });
    } else if (url.pathname === "/err") {
      console.error("[RUNTIME ERROR]:", req.body ? await req.text() : "Unknown error");
      setTimeout(() => {
        exitCode = 1;
        ac.abort();
      }, 10);
      return new Response("Handled", { status: 200 });
    } else if (url.pathname === "/finish") {
      if (raw) {
        logs.forEach((log) => {
          console.log(log);
        });
      } else {
        console.info("Simulation finished");
      }
      setTimeout(() => {
        ac.abort();
      }, 10);
      return new Response("Handled", { status: 200 });
    } else if (url.pathname === "/frame") {
      if (record) {
        const body = await req.arrayBuffer();
        await Deno.writeFile(
          `${tempDirName}/frame${String(++frame).padStart(5, "0")}.png`,
          new Uint8Array(body),
        );
      }

      return new Response("Handled", { status: 200 });
    } else {
      return new Response("Not Found", { status: 404 });
    }
  }).finished;

  return exitCode;
}

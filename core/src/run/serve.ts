import { dirname, fromFileUrl, join } from "@std/path";
import { getAvailablePort } from "@std/net";
import { AudioPlayer } from "./audio/mod.ts";
import { openUrl } from "../open.ts";
import {
  fail,
  failed,
  Failure,
  InputFailureTag,
  Result,
  SystemFailureTag,
} from "../err.ts";
import { AssetManager } from "./assets.ts";
import * as print from "../print.ts";

const coreDir = join(dirname(fromFileUrl(import.meta.url)), "..", "..");
const htmlPath = join(coreDir, "sim.html");
const jsPath = join(coreDir, "sim.js");
const cssPath = join(coreDir, "sim.css");

const htmlContentRaw = await Deno.readTextFile(htmlPath);
const jsContent = await Deno.readTextFile(jsPath);
const cssContent = await Deno.readTextFile(cssPath);
let htmlContent = htmlContentRaw
  .replace("//JS", jsContent)
  .replace("CSS", cssContent);

export async function runServer(
  bundle: string,
  tempDirName: string,
  record: boolean,
  assetManager: AssetManager,
  audioPlayer: AudioPlayer,
): Promise<Result<undefined>> {
  let server: Deno.HttpServer<Deno.NetAddr>;

  let started = false;
  let pingNexted = false;

  let frame = 0;
  const logs: string[] = [];

  const simCode = await Deno.readFile(bundle);

  if (record) {
    htmlContent = htmlContent.replace("SHOULD_RECORD", "true");
  } else {
    htmlContent = htmlContent.replace("SHOULD_RECORD", "false");
  }

  let ret;

  function endAndFail(failure: Failure) {
    ret = failure;
    server.shutdown();
  }

  let servePort: number;

  setTimeout(async () => {
    if (!started) {
      const e = await openUrl(`http://127.0.0.1:${servePort}/`);
      if (e) {
        endAndFail(e);
      }
    }
  }, 2000);

  server = Deno.serve(
    {
      hostname: "127.0.0.1",
      port: getAvailablePort({ preferredPort: 8800 }),
      onListen({ port, hostname }) {
        servePort = port;
        print.info(`Server started at http://${hostname}:${port}/`);
      },
    },
    async (req) => {
      const url = new URL(req.url);

      if (url.pathname === "/") {
        return new Response(htmlContent, {
          headers: { "Content-Type": "text/html" },
        });
      } else if (url.pathname === "/bundle.js") {
        return new Response(simCode, {
          headers: { "Content-Type": "text/javascript" },
        });
      } else if (url.pathname === "/out.js.map") {
        return new Response(await Deno.readFile(bundle + ".map"), {
          headers: { "Content-Type": "text/javascript" },
        });
      }

      if (!started) {
        if (url.pathname === "/begin") {
          print.info("Simulation started");
          started = true;
          return new Response(null, { status: 200 });
        } else if (url.pathname === "/pingNext" && !pingNexted) {
          pingNexted = true;
          return new Response(null, { status: 200 });
        } else {
          return new Response("Not Found", { status: 404 });
        }
      }

      if (url.pathname === "/begin") {
        endAndFail(
          fail(
            SystemFailureTag.MultibleClientsFailure,
            "Multible clients detected.",
          ),
        );
        return new Response(null, { status: 200 });
      } else if (url.pathname === "/log") {
        if (req.body) {
          print.log(await req.text());
        }
        return new Response("Logged", { status: 200 });
      } else if (url.pathname === "/err") {
        endAndFail(
          fail(
            InputFailureTag.RuntimeFailure,
            req.body ? await req.text() : "Unknown error",
          ),
        );
        return new Response(null, { status: 200 });
      } else if (url.pathname === "/finish") {
        setTimeout(() => {
          logs.forEach((log) => {
            print.raw(log);
          });
          print.info("Simulation finished");
          server.shutdown();
        }, 100);

        return new Response(null, { status: 200 });
      } else if (url.pathname === "/frame") {
        if (record) {
          const body = await req.arrayBuffer();
          await Deno.writeFile(
            `${tempDirName}/frame${String(++frame).padStart(5, "0")}.png`,
            new Uint8Array(body),
          );
        }

        return new Response(null, { status: 200 });
      } else if (url.pathname === "/ping") {
        return new Response(null, { status: 200 });
      } else if (url.pathname === "/addSound") {
        const sound = await req.json();
        const id = await audioPlayer.addSound(sound);
        if (failed(id)) {
          endAndFail(id as Failure);
        }
        return new Response(id.toString(), { status: 200 });
      } else if (url.pathname === "/playSound") {
        const id = parseInt(await req.text());
        const r = audioPlayer.playSound(id, frame);
        if (r) {
          endAndFail(r);
        }
        return new Response(null, { status: 200 });
      } else if (url.pathname === "/addFetchAsset") {
        const data = await req.json();
        const r = await assetManager.addFetchAsset(data.path, data.fetchAddr);
        if (r) {
          endAndFail(r);
        }
        return new Response(null, { status: 200 });
      } else {
        return new Response("Not Found", { status: 404 });
      }
    },
  );

  await server.finished;
  return ret;
}

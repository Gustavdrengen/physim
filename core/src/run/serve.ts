import { dirname, fromFileUrl, join } from "@std/path";
import { getAvailablePort } from "@std/net";
import { AudioPlayer } from "./audio/mod.ts";
import { openUrl } from "../open.ts";
import { fail, failed, Failure, InputFailureTag, Result, SystemFailureTag } from "../err.ts";
import { AssetManager } from "./assets.ts";
import * as print from "../print.ts";
import { openWebview } from "./webview.ts";

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
  record: string | undefined,
  assetManager: AssetManager,
  audioPlayer: AudioPlayer,
  useWebview: boolean,
): Promise<Result<string | undefined>> {
  let server: Deno.HttpServer<Deno.NetAddr>;
  let webviewProcess: Deno.ChildProcess | undefined;
  let ffmpegProcess: Deno.ChildProcess | undefined;
  let ffmpegWriter: WritableStreamDefaultWriter<Uint8Array> | undefined;

  let started = false;
  let pingNexted = false;

  let frame = 0;
  const logs: string[] = [];

  const simCode = await Deno.readFile(bundle);

  const videoPath = record;

  if (record) {
    htmlContent = htmlContent.replace("SHOULD_RECORD", "true");
  } else {
    htmlContent = htmlContent.replace("SHOULD_RECORD", "false");
  }

  let ret;

  function endAndFail(failure: Failure) {
    ret = failure;
    webviewProcess?.kill();
    ffmpegProcess?.kill();
    server.shutdown();
  }

  let servePort: number;

  // Start FFmpeg process if recording is enabled
  if (record) {
    ffmpegProcess = new Deno.Command("ffmpeg", {
      args: [
        "-y",
        "-f",
        "image2pipe",
        "-framerate",
        "60",
        "-i",
        "pipe:0",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        record,
      ],
      stdin: "piped",
      stdout: "null",
      stderr: "null",
    }).spawn();
    ffmpegWriter = ffmpegProcess.stdin.getWriter();
  }

  setTimeout(async () => {
    if (!started) {
      const url = `http://127.0.0.1:${servePort}/`;
      if (useWebview) {
        webviewProcess = openWebview(url);
        setTimeout(() => {
          if (!started) {
            endAndFail(
              fail(
                SystemFailureTag.OpenFailure,
                "Failed to establish a connection with the webview.",
              ),
            );
          }
        }, 8000);
      } else {
        const e = await openUrl(url);
        if (e) {
          endAndFail(e);
        } else {
          setTimeout(() => {
            if (!started) {
              endAndFail(
                fail(
                  SystemFailureTag.OpenFailure,
                  "Failed to establish a connection with the browser.",
                ),
              );
            }
          }, 8000);
        }
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
          const text = await req.text();
          logs.push(text);
          print.log(text);
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
        setTimeout(async () => {
          if (print.isRawModeEnabled()) {
            logs.forEach((log) => {
              print.log(log);
            });
          }
          print.info("Simulation finished");

          if (ffmpegWriter) {
            await ffmpegWriter.close();
            await ffmpegProcess.status;
          }

          webviewProcess?.kill();
          server.shutdown();
        }, 100);

        return new Response(null, { status: 200 });
      } else if (url.pathname === "/frame") {
        if (ffmpegWriter) {
          const body = await req.arrayBuffer();
          await ffmpegWriter.write(new Uint8Array(body));
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

  if (ret) {
    return ret;
  }

  return videoPath;
}

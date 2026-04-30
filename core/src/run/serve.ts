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
  formatStackTrace,
} from "../err.ts";
import { AssetManager } from "./assets.ts";
import * as print from "../print.ts";
import { openWebview } from "./webview.ts";
import { TraceMap } from "@jridgewell/trace-mapping";
import { CACHE_DIR } from "../paths.ts";

const coreDir = join(dirname(fromFileUrl(import.meta.url)), "..", "..");
const htmlPath = join(coreDir, "sim.html");
const cssPath = join(coreDir, "sim.css");

export async function runServer(
  bundle: string,
  record: string | undefined,
  assetManager: AssetManager,
  audioPlayer: AudioPlayer,
  useClient: boolean,
  headless: boolean,
  profiling: boolean,
  noThrottle: boolean,
  maxTraceback: number,
  baseDir: string,
  errorOnTime: number | undefined,
  errorOnFrameTime: number | undefined,
): Promise<Result<string | undefined>> {
  const bundleDir = dirname(bundle);
  let server: Deno.HttpServer<Deno.NetAddr>;
  let webviewProcess: Deno.ChildProcess | undefined;
  let ffmpegProcess: Deno.ChildProcess | undefined;
  let ffmpegWriter: WritableStreamDefaultWriter<Uint8Array> | undefined;

  let browser: any | undefined;

  let started = false;
  let pingNexted = false;

  let frame = 0;
  const logs: string[] = [];

  const jsPath = join(CACHE_DIR, 'sim.js');
  const jsContent = await Deno.readTextFile(jsPath);

  const htmlContentRaw = await Deno.readTextFile(htmlPath);
  const cssContent = await Deno.readTextFile(cssPath);
  let htmlContent = htmlContentRaw
    .replace('//JS', jsContent)
    .replace('CSS', cssContent);

  const simCode = await Deno.readFile(bundle);

  let traceMap: TraceMap | null = null;
  try {
    const mapData = await Deno.readTextFile(bundle + ".map");
    traceMap = new TraceMap(mapData);
  } catch {
    // Source map not available, fall back to raw stack
  }

  const videoPath = record;

  if (record) {
    htmlContent = htmlContent.replace(/window\.SHOULD_RECORD = false/g, 'window.SHOULD_RECORD = true');
  } else {
    htmlContent = htmlContent.replace(/window\.SHOULD_RECORD = true/g, 'window.SHOULD_RECORD = false');
  }

  if (profiling) {
    htmlContent = htmlContent.replace(/window\.PROFILING = false/g, 'window.PROFILING = true');
  } else {
    htmlContent = htmlContent.replace(/window\.PROFILING = true/g, 'window.PROFILING = false');
  }

  if (noThrottle) {
    htmlContent = htmlContent.replace(/window\.NO_THROTTLE = false/g, 'window.NO_THROTTLE = true');
  } else {
    htmlContent = htmlContent.replace(/window\.NO_THROTTLE = true/g, 'window.NO_THROTTLE = false');
  }

  if (errorOnTime !== undefined) {
    htmlContent = htmlContent.replace(/window\.MAX_TIME = undefined/g, `window.MAX_TIME = ${errorOnTime}`);
  }

  let ret: Result<string | undefined>;
  let isFinished = false;

  let lastPingTime = Date.now();
  let frameTimeInterval: number | undefined;
  let pingTimeoutInterval: number | undefined;

  async function endAndFail(failure: Failure | undefined) {
    if (isFinished) return;
    isFinished = true;

    ret = failure;

    if (frameTimeInterval !== undefined) {
      clearInterval(frameTimeInterval);
    }
    if (pingTimeoutInterval !== undefined) {
      clearInterval(pingTimeoutInterval);
    }

    if (browser) {
      try {
        await browser.close();
      } catch {}
    }

    webviewProcess?.kill();

    if (ffmpegWriter) {
      try {
        await ffmpegWriter.close();
      } catch {}
      try {
        await ffmpegProcess?.status;
      } catch {}
    } else {
      ffmpegProcess?.kill();
    }

    try {
      await server.shutdown();
    } catch {}
  }

  let servePort: number;

  // Monitor stdin for EOF (Ctrl+D)
  (async () => {
    const buf = new Uint8Array(1024);
    while (!isFinished) {
      try {
        const n = await Deno.stdin.read(buf);
        if (n === null) {
          if (!isFinished) {
            print.info("EOF detected, terminating simulation...");
            await endAndFail(undefined);
          }
          break;
        }
      } catch {
        break;
      }
    }
  })();

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
      clearEnv: true,
      env: {
        PATH: Deno.env.get("PATH") || "",
      },
    }).spawn();
    ffmpegWriter = ffmpegProcess.stdin.getWriter();
  }

  setTimeout(async () => {
    if (!started) {
      const url = `http://127.0.0.1:${servePort}/`;
      if (headless) {
        try {
          // @ts-ignore: Playwright might not be in the type system but is available via npm:
          const { chromium } = await import("npm:playwright");
          browser = await chromium.launch({ headless: true });
          const page = await browser.newPage();
          await page.goto(url);
        } catch (err) {
          endAndFail(
            fail(
              SystemFailureTag.OpenFailure,
              `Failed to launch headless browser (Playwright): ${String(err)}`,
            ),
          );
        }
      } else if (useClient) {
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

      lastPingTime = Date.now();

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
        const body = req.body ? await req.text() : "Unknown error";
        let formattedError: string;
        let tag: InputFailureTag = InputFailureTag.RuntimeFailure;
        try {
          const parsed = JSON.parse(body);
          const message = parsed.message ?? "Unknown error";
          const stack = parsed.stack ?? "";
          const trace = stack
            ? formatStackTrace(stack, traceMap, maxTraceback, baseDir, bundleDir)
            : "";
          formattedError = trace ? `${message}\n${trace}` : message;
          if (parsed.tag && Object.values(InputFailureTag).includes(parsed.tag)) {
            tag = parsed.tag;
          }
        } catch {
          formattedError = body;
        }
        endAndFail(
          fail(
            tag,
            formattedError,
          ),
        );
        return new Response(null, { status: 200 });
      } else if (url.pathname === "/terminate_requirement") {
        const body = await req.json();
        endAndFail(fail(InputFailureTag.RestrictionFailure, body.message));
        return new Response(null, { status: 200 });
      } else if (url.pathname === "/finish") {
        setTimeout(async () => {
          if (print.isRawModeEnabled()) {
            logs.forEach((log) => {
              print.raw(log);
            });
          }
          print.info("Simulation finished");
          await endAndFail(undefined);
        }, 100);

        return new Response(null, { status: 200 });
      } else if (url.pathname === "/frame") {
        frame++;
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
        const data = await req.json();
        const id = Number(data.sound);
        const frm = Number(data.frame ?? frame);
        const r = audioPlayer.playSound(id, frm);
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

  if (errorOnFrameTime !== undefined) {
    frameTimeInterval = setInterval(() => {
      if (started && Date.now() - lastPingTime > errorOnFrameTime * 1000) {
        endAndFail(fail(InputFailureTag.RestrictionFailure, `Frame execution time limit exceeded (${errorOnFrameTime}s)`));
      }
    }, 50);
  }

  pingTimeoutInterval = setInterval(() => {
    if (started && Date.now() - lastPingTime > 3000) {
      endAndFail(fail(SystemFailureTag.NetworkFailure, "Connection lost"));
    }
  }, 1000);

  await server.finished;

  if (frameTimeInterval !== undefined) {
    clearInterval(frameTimeInterval);
  }
  if (pingTimeoutInterval !== undefined) {
    clearInterval(pingTimeoutInterval);
  }

  if (ret) {
    return ret;
  }

  return videoPath;
}

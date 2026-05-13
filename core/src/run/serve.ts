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

const MAX_LAUNCH_RETRIES = 3;
const LAUNCH_BASE_DELAY_MS = 1000;
const PAGE_GOTO_TIMEOUT_MS = 15000;
const RECONNECT_MAX_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 2000;
const SETUP_PING_TIMEOUT_MS = 15000;

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
  errorOnFinishBefore: number | undefined,
): Promise<Result<string | undefined>> {
  const bundleDir = dirname(bundle);
  let server: Deno.HttpServer<Deno.NetAddr>;
  let webviewProcess: Deno.ChildProcess | undefined;
  let ffmpegProcess: Deno.ChildProcess | undefined;
  let ffmpegWriter: WritableStreamDefaultWriter<Uint8Array> | undefined;

  let browser: any | undefined;

  let started = false;
  let pingNexted = false;
  let setupPingTimeout: number | undefined;
  let reconnectAttempts = 0;
  let isReconnecting = false;
  let page: any | undefined;

  let frame = 0;
  const logs: string[] = [];

  function warn(msg: string): void {
    if (!print.isRawModeEnabled()) {
      print.warn(msg);
    }
  }

  function info(msg: string): void {
    if (!print.isRawModeEnabled()) {
      print.info(msg);
    }
  }

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

  if (errorOnFinishBefore !== undefined) {
    htmlContent = htmlContent.replace(/window\.MIN_FINISH_TIME = undefined/g, `window.MIN_FINISH_TIME = ${errorOnFinishBefore}`);
  }

  let ret: Result<string | undefined>;
  let isFinished = false;

  let lastPingTime = Date.now();
  let frameTimeInterval: number | undefined;
  let pingTimeoutInterval: number | undefined;
  let reconnectTimeout: number | undefined;

  async function endAndFail(failure: Failure | undefined) {
    if (isFinished) return;
    isFinished = true;

    // In raw mode, dump all accumulated simulation logs to stdout
    if (print.isRawModeEnabled()) {
      logs.forEach((log) => {
        print.raw(log);
      });
    }

    ret = failure;

    if (frameTimeInterval !== undefined) {
      clearInterval(frameTimeInterval);
    }
    if (pingTimeoutInterval !== undefined) {
      clearInterval(pingTimeoutInterval);
    }
    if (reconnectTimeout !== undefined) {
      clearTimeout(reconnectTimeout);
    }
    if (setupPingTimeout !== undefined) {
      clearTimeout(setupPingTimeout);
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
  if (Deno.stdin.isTerminal()) {
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
  }

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

  // Launch browser with retry logic
  async function launchBrowserWithRetry(url: string, attempt = 1): Promise<boolean> {
    try {
      // @ts-ignore: Playwright might not be in the type system but is available via npm:
      const { chromium } = await import("npm:playwright");
      browser = await chromium.launch({ headless: true });

      page = await browser.newPage();

      // Log browser console messages for debugging
      page.on("console", (msg: any) => {
        if (!print.isRawModeEnabled()) {
          console.log(`[Browser Console] ${msg.text()}`);
        }
      });

      page.on("pageerror", (err: any) => {
        if (!print.isRawModeEnabled()) {
          console.error(`[Browser Error] ${err.message}`);
        }
      });

      await page.goto(url, { timeout: PAGE_GOTO_TIMEOUT_MS });
      return true;
    } catch (err) {
      if (attempt < MAX_LAUNCH_RETRIES) {
        const delay = LAUNCH_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        warn(`Browser launch attempt ${attempt} failed: ${String(err)}`);
        warn(`Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_LAUNCH_RETRIES})...`);

        // Close browser if partially launched
        if (browser) {
          try {
            await browser.close();
          } catch {}
          browser = undefined;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        return launchBrowserWithRetry(url, attempt + 1);
      }
      return false;
    }
  }

  // Reconnect browser with warning
  async function reconnectBrowser(url: string): Promise<boolean> {
    if (reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      return false;
    }

    if (isReconnecting) {
      return false; // Already attempting to reconnect
    }
    isReconnecting = true;

    reconnectAttempts++;
    warn(`Connection lost, attempting reconnection (${reconnectAttempts}/${RECONNECT_MAX_ATTEMPTS})...`);

    try {
      // Close existing page if any
      if (page) {
        try {
          await page.close();
        } catch {}
      }

      // Reset connection state so the re-loaded page's /begin request
      // is treated as a fresh connection, not a duplicate client.
      started = false;
      pingNexted = false;

      // Create new page
      page = await browser.newPage();

      // Log browser console messages for debugging
      page.on("console", (msg: any) => {
        if (!print.isRawModeEnabled()) {
          console.log(`[Browser Console] ${msg.text()}`);
        }
      });

      page.on("pageerror", (err: any) => {
        if (!print.isRawModeEnabled()) {
          console.error(`[Browser Error] ${err.message}`);
        }
      });

      await page.goto(url, { timeout: PAGE_GOTO_TIMEOUT_MS });
      warn("Reconnection successful");
      return true;
    } catch (err) {
      // Restore started state so the ping timeout can keep retrying
      started = true;
      warn(`Reconnection attempt ${reconnectAttempts} failed: ${String(err)}`);
      return false;
    } finally {
      isReconnecting = false;
    }
  }

  setTimeout(async () => {
    if (!started) {
      const url = `http://127.0.0.1:${servePort}/`;
      if (headless) {
        const success = await launchBrowserWithRetry(url);
        if (!success) {
          endAndFail(
            fail(
              SystemFailureTag.OpenFailure,
              `Failed to launch headless browser after ${MAX_LAUNCH_RETRIES} attempts (Playwright)`,
            ),
          );
        } else {
          // Set up timeout for initial connection (before 'started' is true)
          setupPingTimeout = setTimeout(() => {
            if (!started) {
              endAndFail(
                fail(
                  SystemFailureTag.NetworkFailure,
                  `Browser connected but simulation failed to start within ${SETUP_PING_TIMEOUT_MS / 1000}s`,
                ),
              );
            }
          }, SETUP_PING_TIMEOUT_MS);
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
        if (url.pathname === "/begin" || url.pathname === "/ping") {
          // Clear the setup ping timeout since we got a response
          if (setupPingTimeout !== undefined) {
            clearTimeout(setupPingTimeout);
            setupPingTimeout = undefined;
          }
          if (url.pathname === "/begin") {
            info("Simulation started");
            started = true;
          }
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
    if (started && Date.now() - lastPingTime > 10000) {
      // Reset ping timer so we don't keep re-triggering during reconnect delay
      lastPingTime = Date.now();
      if (headless && reconnectAttempts < RECONNECT_MAX_ATTEMPTS) {
        const url = `http://127.0.0.1:${servePort}/`;
        if (reconnectTimeout !== undefined) {
          clearTimeout(reconnectTimeout);
        }
        reconnectTimeout = setTimeout(() => {
          reconnectBrowser(url).then((success) => {
            if (success) {
              // Reset ping time since we reconnected
              lastPingTime = Date.now();
            } else if (reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
              endAndFail(fail(SystemFailureTag.NetworkFailure, `Connection lost after ${RECONNECT_MAX_ATTEMPTS} reconnection attempts`));
            }
          }).catch(() => {
            // Reconnection threw, check if we've exhausted attempts
            if (reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
              endAndFail(fail(SystemFailureTag.NetworkFailure, `Connection lost after ${RECONNECT_MAX_ATTEMPTS} reconnection attempts`));
            }
          });
        }, RECONNECT_DELAY_MS);
      } else {
        endAndFail(fail(SystemFailureTag.NetworkFailure, "Connection lost"));
      }
    }
  }, 1000);

  await server.finished;

  if (frameTimeInterval !== undefined) {
    clearInterval(frameTimeInterval);
  }
  if (pingTimeoutInterval !== undefined) {
    clearInterval(pingTimeoutInterval);
  }
  if (reconnectTimeout !== undefined) {
    clearTimeout(reconnectTimeout);
  }

  if (ret) {
    return ret;
  }

  return videoPath;
}

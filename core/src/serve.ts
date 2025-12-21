import { dirname, fromFileUrl, join } from "@std/path";
import { AudioPlayer } from "./audio.ts";
import { fail, failed, Failure, InputFailureTag, Result, SystemFailureTag } from "./err.ts";
import { AssetManager } from "./assets.ts";

const ac = new AbortController();

const PORT = 8080;

const scriptDir = dirname(fromFileUrl(import.meta.url));
const htmlPath = join(scriptDir, "..", "sim.html");
const jsPath = join(scriptDir, "..", "sim.js");
const cssPath = join(scriptDir, "..", "sim.css");

const htmlContentRaw = await Deno.readTextFile(htmlPath);
const jsContent = await Deno.readTextFile(jsPath);
const cssContent = await Deno.readTextFile(cssPath);
let htmlContent = htmlContentRaw.replace("//JS", jsContent).replace("CSS", cssContent);

export async function openUrl(url: string): Promise<Result<undefined>> {
  try {
    new URL(url);
  } catch {
    if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(url)) {
      return fail(SystemFailureTag.OpenFailure, `Invalid URL or missing scheme: ${String(url)}`);
    }
  }

  const os = Deno.build.os;
  let program: string;
  let args: string[];

  if (os === "windows") {
    program = "cmd.exe";
    args = ["/c", "start", "", url];
  } else if (os === "darwin") {
    program = "open";
    args = [url];
  } else {
    let isWsl = false;
    try {
      if (Deno.env.get("WSL_DISTRO_NAME")) isWsl = true;
      else {
        const ver = await Deno.readTextFile("/proc/version");
        if (/microsoft/i.test(ver)) isWsl = true;
      }
    } catch {
      //
    }

    if (isWsl) {
      program = "cmd.exe";
      args = ["/c", "start", "", url];
    } else {
      program = "xdg-open";
      args = [url];
    }
  }

  try {
    const proc = new Deno.Command(program, { args });
    const { success, code, stderr } = await proc.output();

    if (success) return;

    const stderrText = new TextDecoder().decode(stderr).trim();
    const msg = `Command exited with code ${code}${stderrText ? `: ${stderrText}` : ""}`;
    return fail(SystemFailureTag.OpenFailure, msg);
  } catch (err) {
    return fail(
      SystemFailureTag.OpenFailure,
      `Failed to launch browser command (${program} ${args.join(" ")}): ${String(err)}`,
    );
  }
}

export async function runServer(
  bundle: string,
  tempDirName: string,
  raw: boolean,
  record: boolean,
  assetManager: AssetManager,
  audioPlayer: AudioPlayer,
): Promise<Result<undefined>> {
  let started = false;

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
    setTimeout(() => {
      ret = failure;
      ac.abort();
    }, 10);
  }

  setTimeout(async () => {
    if (!started) {
      const e = await openUrl(`http://127.0.0.1:${PORT}/`);
      if (e) {
        endAndFail(e);
      }
    }
  }, 2000);

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
        if (!raw) {
          console.info("Simulation started");
        }
        started = true;
        return new Response("Ok", { status: 200 });
      } else {
        return new Response("Not Found", { status: 404 });
      }
    }

    if (url.pathname === "/begin") {
      endAndFail(fail(SystemFailureTag.MultibleClientsFailure, "Multible clients detected."));
      return new Response(null, { status: 200 });
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
      endAndFail(
        fail(InputFailureTag.RuntimeFailure, req.body ? await req.text() : "Unknown error"),
      );
      return new Response(null, { status: 200 });
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
      const id = audioPlayer.addSound(sound);
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
  }).finished;

  return ret;
}

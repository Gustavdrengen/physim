import { runInFrame } from "./run_in_frame.ts";
import {
  initYieldChannel,
  sendYield,
  setWriteToTerminal,
  sim,
  stopSimulation,
  updateDebugWindow,
  waitForYield,
} from "./sim_api.ts";
import { flushFrame, resetFrameState } from "./flush.ts";
import { showErrorOverlay, showFinishOverlay } from "./overlays.ts";
import { setupUI, startPinging, waitForNext } from "./ui.ts";
import { fixCanvasDisplay, hiddenCtx } from "./webgl.ts";
import { __profiling } from "./profiling.ts";
import {
  frameCountState,
  getHasError,
  getIsStopped,
  getRunResolve,
  incrementFrameCount,
  markNeedsFlush,
  resetFrameCountState,
  resetShaderIds,
  setFpsTimer,
  setHasError,
  setIsFinished,
  setRunResolve,
  updateFPS,
  updateLastFrameTime,
} from "./state.ts";

export function setFinished(val: boolean): void {
  setIsFinished(val);
}

export function setNeedsFlush(val: boolean): void {
  frameCountState.needsFlush = val;
}

// Export the run function for sim_api to use
export function runSimulation(onUpdate: () => unknown): Promise<void> {
  const existingResolve = getRunResolve();
  if (existingResolve) {
    existingResolve();
  }

  return new Promise((resolve) => {
    setRunResolve(resolve);
    resetFrameCountState();
    resetShaderIds();
    frameCountState.framesThisSecond = 0;
    frameCountState.currentFPS = 0;

    const fpsTimer = setInterval(() => {
      updateFPS();
      updateDebugWindow();
    }, 1000);
    setFpsTimer(fpsTimer);

    let running = true;
    sim._stopRunning = () => {
      running = false;
    };

    const runFrame = async () => {
      try {
        incrementFrameCount();

        if (
          typeof (globalThis as any).MAX_TIME !== "undefined" &&
          frameCountState.frameCount / 60 > (globalThis as any).MAX_TIME
        ) {
          fetch("/terminate_requirement", {
            method: "POST",
            body: JSON.stringify({
              message: `In-simulation time limit exceeded (${(globalThis as any).MAX_TIME}s)`,
            }),
            headers: { "Content-Type": "application/json" },
          }).catch(() => {});
          setHasError(true);
          stopSimulation();
          return;
        }

        markNeedsFlush();
        resetFrameState();
        const result = onUpdate();
        if (result instanceof Promise) {
          await result.catch(errorHandler);
        }
        flushFrame();
      } catch (err) {
        errorHandler(err);
      }

      if (
        typeof (globalThis as any).SHOULD_RECORD !== "undefined" &&
        (globalThis as any).SHOULD_RECORD
      ) {
        await new Promise<void>((resolveBlob) => {
          const canvas = document.getElementById("sim") as HTMLCanvasElement;
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                await fetch("/frame", { method: "POST", body: blob });
              } catch {
                //
              }
            }
            resolveBlob();
          }, "image/png");
        });
      }
    };

    let nextFrameTime = performance.now();

    const runLoop = async () => {
      while (running) {
        const frameStart = performance.now();
        updateLastFrameTime(frameStart);

        await runFrame();

        sendYield();
        await waitForYield();

        if (typeof (globalThis as any).NO_THROTTLE === "undefined" && running) {
          const targetFrameTime = 1000 / 60;
          nextFrameTime += targetFrameTime;
          const sleepTime = nextFrameTime - performance.now();
          if (sleepTime > 0) {
            await new Promise<void>((r) => setTimeout(r, sleepTime));
          }
        }
      }
      resolve();
      setRunResolve(null);
    };

    runLoop();
  });
}

function errorHandler(err: unknown): void {
  setHasError(true);
  console.error(err);
  showErrorOverlay(err);

  fetch("/err", {
    method: "POST",
    body: JSON.stringify({
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : "",
    }),
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});

  stopSimulation();
  waitForNext();
}

// Populate sim object
sim.run = runSimulation;
sim.ctx = hiddenCtx;

async function main(): Promise<void> {
  initYieldChannel();
  fixCanvasDisplay();
  window.addEventListener("resize", fixCanvasDisplay);

  startPinging();

  const response = await fetch("/bundle.js");
  const code = await response.text();

  const val = await runInFrame(code, {
    endowments: { sim },
    onError: errorHandler,
  });
  (window as Record<string, unknown>).simFrame = val;

  if (getHasError() || getIsStopped()) {
    return;
  }

  setIsFinished(true);
  fetch("/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});
  stopSimulation();
  showFinishOverlay();
  waitForNext();
}

// Setup UI after DOM is ready
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    setupUI((text) => {
      const terminalBody = document.getElementById("terminalBody");
      if (terminalBody) {
        const line = document.createElement("div");
        line.className = "terminal-line";
        line.textContent = `> ${text}`;
        terminalBody.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
      }
      console.log(text);
    });
    // Wire up the logging to sim_api
    setWriteToTerminal((text) => {
      const terminalBody = document.getElementById("terminalBody");
      if (terminalBody) {
        const line = document.createElement("div");
        line.className = "terminal-line";
        line.textContent = `> ${text}`;
        terminalBody.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
      }
      console.log(text);
    });
  });
}

// Notify server we're ready
fetch("/begin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
}).catch(() => {});

// Start the main flow
main().catch((err) => {
  console.error("Fatal error:", err);
  showErrorOverlay(err);
});

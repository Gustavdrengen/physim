import { __profiling } from "./profiling.ts";
import { frameCountState, getIsFinished, setIsStopped } from "./state.ts";
import { setDebugUpdateFn, stopSimulation } from "./sim_api.ts";
import { showStoppedOverlay } from "./overlays.ts";

export function setupUI(writeTerminalFn: (text: string) => void): void {
  const navbar = document.getElementById("navbar")!;
  const showNavBtn = document.getElementById("showNavBtn")!;
  const hideNavBtn = document.getElementById("hideNavBtn")!;
  const terminal = document.getElementById("terminal")!;
  const terminalBtn = document.getElementById("terminalBtn")!;
  const closeTerminalBtn = document.getElementById("closeTerminalBtn")!;
  const stopBtn = document.getElementById("stopBtn")!;
  const terminalBody = document.getElementById("terminalBody")!;
  const debug = document.getElementById("debug")!;
  const debugBtn = document.getElementById("debugBtn")!;
  const closeDebugBtn = document.getElementById("closeDebugBtn")!;

  function toggleDebug() {
    debug.classList.toggle("open");
  }

  function updateDebugWindow() {
    const debugFrame = document.getElementById("debugFrame");
    const debugTime = document.getElementById("debugTime");
    const debugFPS = document.getElementById("debugFPS");
    const debugFrameTime = document.getElementById("debugFrameTime");

    if (debugFrame) debugFrame.textContent = String(frameCountState.frameCount);
    if (debugTime) {
      debugTime.textContent =
        (frameCountState.frameCount / 60).toFixed(2) + "s";
    }
    if (debugFPS) {
      if (
        frameCountState.currentFPS === 0 &&
        frameCountState.framesThisSecond === 0
      ) {
        debugFPS.textContent = "not running";
      } else {
        debugFPS.textContent = String(frameCountState.currentFPS);
      }
    }
    if (debugFrameTime) {
      if (
        frameCountState.currentFPS === 0 &&
        frameCountState.framesThisSecond === 0
      ) {
        debugFrameTime.textContent = "not running";
      } else {
        debugFrameTime.textContent =
          frameCountState.currentFrameTime.toFixed(2) + "ms";
      }
    }

    const profilingSection = document.getElementById("debugProfilingSection");
    const profilingContainer = document.getElementById("debugProfiling");
    if (profilingSection && profilingContainer && __profiling.enabled) {
      profilingSection.style.display = "block";
      const stats = __profiling.getStats();
      if (stats.length > 0) {
        const totalTime = stats.reduce((sum, s) => sum + s.total, 0);
        profilingContainer.innerHTML = stats
          .map((stat) => {
            const percent = ((stat.total / totalTime) * 100).toFixed(1);
            const avg = (stat.total / stat.calls).toFixed(2);
            const avgCalls = (stat.calls / frameCountState.frameCount).toFixed(
              2,
            );
            const indent = (stat.fullName.match(/>/g) || []).length * 16;
            return `<div class=\"debug-profiling-item\" style=\"padding-left: ${indent}px;\">
            <div class=\"debug-profiling-name\">${stat.fullName}</div>
            <div class=\"debug-profiling-stats\">${avgCalls} avg calls | ${avg}ms avg | ${stat.total.toFixed(
              2,
            )}ms total (${percent}%)</div>
          </div>`;
          })
          .join("");
      }
    }
  }

  setDebugUpdateFn(updateDebugWindow);

  function toggleTerminal() {
    terminal.classList.toggle("open");
  }

  function toggleNavbar() {
    navbar.classList.toggle("hidden");
    showNavBtn.classList.toggle("visible");
  }

  function handleStop() {
    setIsStopped(true);
    fetch("/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
    stopSimulation();
    showStoppedOverlay();
    waitForNext();
  }

  terminalBtn.addEventListener("click", toggleTerminal);
  closeTerminalBtn.addEventListener("click", toggleTerminal);
  hideNavBtn.addEventListener("click", toggleNavbar);
  showNavBtn.addEventListener("click", toggleNavbar);
  stopBtn.addEventListener("click", handleStop);
  debugBtn.addEventListener("click", toggleDebug);
  closeDebugBtn.addEventListener("click", toggleDebug);

  window.addEventListener("resize", () => {
    import("./webgl.ts").then(({ fixCanvasDisplay }) => fixCanvasDisplay());
  });
}

export function waitForNext(): void {
  setInterval(() => {
    fetch("/pingNext")
      .then((res) => {
        if (res.status === 200) {
          location.reload();
        }
      })
      .catch(() => {});
  }, 300);
}

export function startPinging(): ReturnType<typeof setInterval> {
  return setInterval(() => {
    fetch("/ping")
      .then((res) => {
        if (!res.ok && !getIsFinished()) {
          setIsStopped(true);
          stopSimulation();
          showStoppedOverlay();
          waitForNext();
        }
      })
      .catch(() => {
        if (!getIsFinished()) {
          setIsStopped(true);
          stopSimulation();
          showStoppedOverlay();
          waitForNext();
        }
      });
  }, 300);
}

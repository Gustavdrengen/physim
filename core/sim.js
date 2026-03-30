function runInFrame(code, endowments = {}, onError) {
  return new Promise((outerResolve, outerReject) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.srcdoc = "<!doctype html><html><head></head><body></body></html>";

    let userBlobUrl;
    let wrapperBlobUrl;
    let settled = false;

    const settleOnce = (fn) => (val) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn(val);
    };

    const resolveOnce = settleOnce(outerResolve);
    const rejectOnce = settleOnce((reason) =>
      outerReject(reason instanceof Error ? reason : new Error(reason)),
    );

    const callOnError = (err) => {
      if (typeof onError === "function") {
        try {
          onError(err);
        } catch {
          //
        }
      }
    };

    const errorHandler = (ev) => {
      const err = ev?.error || ev?.reason || ev?.message || ev;
      callOnError(err);
      rejectOnce(err || new Error("Unhandled error in iframe"));
    };

    const rejectionHandler = (ev) => {
      const err = ev?.reason || ev;
      callOnError(err);
      rejectOnce(err || new Error("Unhandled rejection in iframe"));
    };

    const scriptErrorHandler = (ev) => {
      const err = ev?.error || ev || new Error("Script failed to load/run");
      callOnError(err);
      rejectOnce(err);
    };

    const cleanup = () => {
      if (userBlobUrl) {
        try {
          URL.revokeObjectURL(userBlobUrl);
        } catch {
          //
        }
      }
      if (wrapperBlobUrl) {
        try {
          URL.revokeObjectURL(wrapperBlobUrl);
        } catch {
          //
        }
      }

      const win = iframe.contentWindow;
      if (win) {
        try {
          win.removeEventListener("error", errorHandler);
          win.removeEventListener("unhandledrejection", rejectionHandler);
          delete win.__runInFrameDone;
          delete win.__runInFrameDoneResolve;
          delete win.__runInFrameDoneReject;
        } catch {
          //
        }
      }

      try {
        iframe.removeEventListener("load", onLoad);
      } catch {
        //
      }
    };

    const onLoad = () => {
      try {
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;

        win.addEventListener("error", errorHandler);
        win.addEventListener("unhandledrejection", rejectionHandler);

        Object.entries(endowments).forEach(([key, value]) => {
          try {
            win[key] = value;
          } catch {
            //
          }
        });

        let resolveInner, rejectInner;
        const donePromise = new Promise((res, rej) => {
          resolveInner = res;
          rejectInner = rej;
        });

        win.__runInFrameDone = donePromise;
        win.__runInFrameDoneResolve = resolveInner;
        win.__runInFrameDoneReject = rejectInner;

        userBlobUrl = URL.createObjectURL(
          new Blob([code], { type: "text/javascript" }),
        );

        const wrapperCode = `
          (async () => {
            try {
              const ns = await import(${JSON.stringify(userBlobUrl)});
              window?.__runInFrameDoneResolve?.(ns);
              return ns;
            } catch (err) {
              window?.__runInFrameDoneReject?.(err);
              throw err;
            }
          })();
        `;

        wrapperBlobUrl = URL.createObjectURL(
          new Blob([wrapperCode], { type: "text/javascript" }),
        );

        const script = doc.createElement("script");
        script.type = "module";
        script.src = wrapperBlobUrl;
        script.onerror = scriptErrorHandler;

        doc.body.appendChild(script);

        donePromise
          .then((moduleNamespace) => {
            resolveOnce({
              iframe,
              window: win,
              document: doc,
              module: moduleNamespace,
            });
          })
          .catch((err) => {
            callOnError(err);
            rejectOnce(err);
          });
      } catch (err) {
        callOnError(err);
        rejectOnce(err);
      }
    };

    iframe.addEventListener("load", onLoad);
    document.body.appendChild(iframe);
  });
}

function showOverlay({ id, title, message, color, centered = false }) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = id;
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    background: color,
    color: "white",
    zIndex: "5",
    fontFamily: "monospace",
    boxSizing: "border-box",
  });

  if (centered) {
    Object.assign(overlay.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "48px",
      fontWeight: "bold",
    });
    const text = document.createElement("div");
    text.textContent = title;
    overlay.appendChild(text);
  } else {
    Object.assign(overlay.style, {
      padding: "20px",
      overflow: "auto",
    });

    const container = document.createElement("div");
    Object.assign(container.style, {
      maxWidth: "900px",
      margin: "40px auto",
    });

    const titleEl = document.createElement("h1");
    titleEl.textContent = title;
    titleEl.style.marginTop = "0";
    container.appendChild(titleEl);

    if (message) {
      const messageEl = document.createElement("pre");
      messageEl.textContent = message;
      container.appendChild(messageEl);
    }

    overlay.appendChild(container);
  }

  document.body.appendChild(overlay);
}

function showFinishOverlay() {
  showOverlay({
    id: "finish-overlay",
    title: "Finished",
    color: "rgba(0, 180, 0, 0.85)",
    centered: true,
  });
}

function showErrorOverlay(err) {
  if (!err) return;
  showOverlay({
    id: "error-overlay",
    title: "Error",
    message: `${err.message || String(err)}\n\n${err.stack || "(no stack trace available)"}`,
    color: "rgba(255, 0, 0, 0.85)",
    centered: false,
  });
}

function showStoppedOverlay() {
  showOverlay({
    id: "stopped-overlay",
    title: "Stopped",
    color: "rgba(255, 180, 0, 0.85)",
    centered: true,
  });
}

const response = await fetch("/bundle.js");
const code = await response.text();

let interval = null;
let pingInterval = null;
let isFinished = false;
let frameCount = 0;
let framesThisSecond = 0;
let currentFPS = 0;
let fpsTimer = null;

const __profiling = {
  enabled: typeof PROFILING !== 'undefined' && PROFILING,
  stack: [],
  stats: new Map(),
  
  enter(name) {
    if (!this.enabled) return;
    this.stack.push({ name, start: performance.now() });
  },
  
  exit() {
    if (!this.enabled || !this.stack.length) return;
    const frame = this.stack.pop();
    const duration = performance.now() - frame.start;
    
    let stat = this.stats.get(frame.name);
    if (!stat) {
      stat = { total: 0, calls: 0, min: Infinity, max: 0, last: 0 };
      this.stats.set(frame.name, stat);
    }
    stat.total += duration;
    stat.calls++;
    stat.min = Math.min(stat.min, duration);
    stat.max = Math.max(stat.max, duration);
    stat.last = duration;
  },
  
  getStats() {
    const result = [];
    for (const [name, stat] of this.stats) {
      result.push({ name, ...stat });
    }
    return result.sort((a, b) => b.total - a.total);
  },
  
  reset() {
    this.stats.clear();
    this.stack = [];
  }
};

const canvas = document.getElementById("sim");

function fixCanvasDisplay() {
  const windowRatio = window.innerWidth / window.innerHeight;
  const canvasRatio = canvas.width / canvas.height;

  if (windowRatio > canvasRatio) {
    canvas.style.width = `${window.innerHeight * canvasRatio}px`;
    canvas.style.height = `${window.innerHeight}px`;
  } else {
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerWidth / canvasRatio}px`;
  }
}

window.addEventListener("resize", fixCanvasDisplay);
fixCanvasDisplay();

function stopSimulation() {
  if (interval !== null) {
    clearInterval(interval);
    interval = null;
  }
  if (pingInterval !== null) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  if (fpsTimer !== null) {
    clearInterval(fpsTimer);
    fpsTimer = null;
  }
  if (sim._stopRunning) {
    sim._stopRunning();
  }
  updateDebugWindow();
}

let runResolve = null;

const sim = {
  log: (...args) => {
    writeToTerminal(args.join("\t"));
    fetch("/log", {
      method: "POST",
      keepalive: true,
      body: args
        .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
        .join("\t"),
      headers: { "Content-Type": "application/json" },
    }).catch(() => { });
  },
  finish: () => {
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
    if (runResolve) {
      runResolve();
      runResolve = null;
    }
  },
  ctx: canvas.getContext("2d"),
  resizeCanvas: (width, height) => {
    canvas.width = width;
    canvas.height = height;
    fixCanvasDisplay();
  },
  addSound: async (soundProps) => {
    try {
      const res = await fetch("/addSound", {
        method: "POST",
        body: JSON.stringify(soundProps),
        headers: { "Content-Type": "application/json" },
      });
      return parseInt(await res.text());
    } catch (_) {
      return -1;
    }
  },
  playSound: (sound) => {
    fetch("/playSound", {
      method: "POST",
      body: sound.toString(),
      headers: { "Content-Type": "application/json" },
    }).catch(() => { });
  },
  addFetchAsset: async (path, fetchAddr) => {
    try {
      await fetch("/addFetchAsset", {
        method: "POST",
        body: JSON.stringify({ path, fetchAddr }),
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      //
    }
  },
  __PROFILE_ENTER: (name) => {
    __profiling.enter(name);
  },
  __PROFILE_EXIT: () => {
    __profiling.exit();
  },
};

fetch("/begin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
}).catch(() => { });

function startPinging() {
  pingInterval = setInterval(() => {
    fetch("/ping")
      .then((res) => {
        if (!res.ok && !isFinished) {
          stopSimulation();
          showStoppedOverlay();
          waitForNext();
        }
      })
      .catch(() => {
        if (!isFinished) {
          stopSimulation();
          showStoppedOverlay();
          waitForNext();
        }
      });
  }, 300);
}

function errorHandler(err) {
  console.error(err);
  showErrorOverlay(err);

  fetch("/err", {
    method: "POST",
    body: err.message,
    headers: { "Content-Type": "application/json" },
  }).catch(() => { });

  stopSimulation();
  waitForNext();
}

runInFrame(code, { sim }, errorHandler).then((val) => {
  window.simFrame = val;

  startPinging();

  // Handle automatic finish when the script reaches its end
  isFinished = true;
  fetch("/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(() => { });
  stopSimulation();
  showFinishOverlay();
  waitForNext();
});

sim.run = (onUpdate) => {
  if (runResolve) {
    runResolve();
  }

  return new Promise((resolve) => {
    runResolve = resolve;
    frameCount = 0;
    framesThisSecond = 0;
    currentFPS = 0;

    if (fpsTimer) clearInterval(fpsTimer);
    fpsTimer = setInterval(() => {
      currentFPS = framesThisSecond;
      framesThisSecond = 0;
      updateDebugWindow();
    }, 1000);

    interval = true;
    let running = true;
    sim._stopRunning = () => { 
      running = false; 
      interval = null;
    };

    const runFrame = async () => {
      try {
        frameCount++;
        framesThisSecond++;
        updateDebugWindow();

        const result = onUpdate();
        if (result instanceof Promise) {
          result.catch(errorHandler);
        }
      } catch (err) {
        errorHandler(err);
      }

      if (SHOULD_RECORD) {
        await new Promise((resolve) => {
          canvas.toBlob(async (blob) => {
            try {
              await fetch("/frame", { method: "POST", body: blob });
            } catch {
              //
            }
            resolve();
          }, "image/png");
        });
      }
    };

    const runLoop = async () => {
      while (running) {
        await runFrame();
        if (running) {
          await new Promise((resolve) => setTimeout(resolve, 1000 / 60));
        }
      }
    };

    runLoop();
  });
};

function waitForNext() {
  setInterval(() => {
    fetch("/pingNext")
      .then((res) => {
        if (res.status === 200) {
          location.reload();
        }
      })
      .catch(() => { });
  }, 300);
}

const navbar = document.getElementById("navbar");
const showNavBtn = document.getElementById("showNavBtn");
const hideNavBtn = document.getElementById("hideNavBtn");
const terminal = document.getElementById("terminal");
const terminalBtn = document.getElementById("terminalBtn");
const closeTerminalBtn = document.getElementById("closeTerminalBtn");
const stopBtn = document.getElementById("stopBtn");
const terminalBody = document.getElementById("terminalBody");

const debug = document.getElementById("debug");
const debugBtn = document.getElementById("debugBtn");
const closeDebugBtn = document.getElementById("closeDebugBtn");
const debugFrame = document.getElementById("debugFrame");
const debugTime = document.getElementById("debugTime");
const debugFPS = document.getElementById("debugFPS");

function toggleDebug() {
  debug.classList.toggle("open");
}

function updateDebugWindow() {
  if (debugFrame) debugFrame.textContent = frameCount;
  if (debugTime) debugTime.textContent = (frameCount / 60).toFixed(2) + "s";
  if (debugFPS) {
    if (interval === null) {
      debugFPS.textContent = "not running";
    } else {
      debugFPS.textContent = currentFPS;
    }
  }
  
  const profilingSection = document.getElementById("debugProfilingSection");
  const profilingContainer = document.getElementById("debugProfiling");
  if (profilingSection && profilingContainer && __profiling.enabled) {
    profilingSection.style.display = "block";
    const stats = __profiling.getStats();
    if (stats.length > 0) {
      const totalTime = stats.reduce((sum, s) => sum + s.total, 0);
      profilingContainer.innerHTML = stats.map(stat => {
        const percent = ((stat.total / totalTime) * 100).toFixed(1);
        const avg = (stat.total / stat.calls).toFixed(2);
        return `<div class="debug-profiling-item">
          <div class="debug-profiling-name">${stat.name}</div>
          <div class="debug-profiling-stats">${stat.calls} calls | ${avg}ms avg | ${stat.total.toFixed(2)}ms total (${percent}%)</div>
        </div>`;
      }).join("");
    }
  }
}

function toggleTerminal() {
  terminal.classList.toggle("open");
}

function toggleNavbar() {
  navbar.classList.toggle("hidden");
  showNavBtn.classList.toggle("visible");
}

function writeToTerminal(text) {
  const line = document.createElement("div");
  line.className = "terminal-line";
  line.textContent = `> ${text}`;
  terminalBody.appendChild(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
  console.log(text);
}

function handleStop() {
  fetch("/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(() => { });
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

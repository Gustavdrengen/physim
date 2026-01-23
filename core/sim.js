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
      outerReject(reason instanceof Error ? reason : new Error(reason))
    );

    const callOnError = (err) => {
      if (typeof onError === "function") {
        try {
          onError(err);
        } catch (_) {}
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
        } catch (_) {}
      }
      if (wrapperBlobUrl) {
        try {
          URL.revokeObjectURL(wrapperBlobUrl);
        } catch (_) {}
      }

      const win = iframe.contentWindow;
      if (win) {
        try {
          win.removeEventListener("error", errorHandler);
          win.removeEventListener("unhandledrejection", rejectionHandler);
          delete win.__runInFrameDone;
          delete win.__runInFrameDoneResolve;
          delete win.__runInFrameDoneReject;
        } catch (_) {}
      }

      try {
        iframe.removeEventListener("load", onLoad);
      } catch (_) {}
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
          } catch (_) {}
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
}

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
    }).catch(() => {});
  },
  finish: () => {
    isFinished = true;
    fetch("/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
    stopSimulation();
    showFinishOverlay();
    waitForNext();
  },
  ctx: canvas.getContext("2d"),
  frame: 0,
  resizeCanvas: (width, height) => {
    canvas.width = width;
    canvas.height = height;
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
    }).catch(() => {});
  },
  addFetchAsset: async (path, fetchAddr) => {
    try {
      await fetch("/addFetchAsset", {
        method: "POST",
        body: JSON.stringify({ path, fetchAddr }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (_) {}
  },
};

fetch("/begin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
}).catch(() => {});

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
  }).catch(() => {});

  stopSimulation();
  waitForNext();
}

runInFrame(code, { sim }, errorHandler).then((val) => {
  window.simFrame = val;

  startPinging();

  if (sim.onUpdate) {
    interval = setInterval(() => {
      sim.onUpdate();

      if (SHOULD_RECORD) {
        canvas.toBlob(async (blob) => {
          try {
            await fetch("/frame", { method: "POST", body: blob });
          } catch (_) {}
        }, "image/png");
      }

      sim.frame += 1;
    }, 1000 / 60);
  }
});

function waitForNext() {
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

const navbar = document.getElementById("navbar");
const showNavBtn = document.getElementById("showNavBtn");
const hideNavBtn = document.getElementById("hideNavBtn");
const terminal = document.getElementById("terminal");
const terminalBtn = document.getElementById("terminalBtn");
const closeTerminalBtn = document.getElementById("closeTerminalBtn");
const stopBtn = document.getElementById("stopBtn");
const terminalBody = document.getElementById("terminalBody");

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
  stopSimulation();
  showStoppedOverlay();
  waitForNext();
}

terminalBtn.addEventListener("click", toggleTerminal);
closeTerminalBtn.addEventListener("click", toggleTerminal);
hideNavBtn.addEventListener("click", toggleNavbar);
showNavBtn.addEventListener("click", toggleNavbar);
stopBtn.addEventListener("click", handleStop);

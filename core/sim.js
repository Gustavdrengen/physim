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
      try {
        cleanup();
      } catch (_) {}
      fn(val);
    };

    const resolveOnce = settleOnce(outerResolve);
    const rejectOnce = settleOnce((reason) =>
      outerReject(reason instanceof Error ? reason : new Error(reason))
    );

    const doOnErrorCallback = (err) => {
      try {
        if (typeof onError === "function") onError(err);
      } catch (_) {}
    };

    const errorHandler = (ev) => {
      const err = ev && (ev.error || ev.reason || ev.message || ev);
      doOnErrorCallback(err);
      rejectOnce(err || new Error("Unhandled error in iframe"));
    };

    const rejectionHandler = (ev) => {
      const err = ev && (ev.reason || ev);
      doOnErrorCallback(err);
      rejectOnce(err || new Error("Unhandled rejection in iframe"));
    };

    const onScriptError = (ev) => {
      const e = ev && (ev.error || ev) || new Error("Script failed to load/run");
      doOnErrorCallback(e);
      rejectOnce(e);
    };

    const cleanup = () => {
      try {
        if (userBlobUrl) URL.revokeObjectURL(userBlobUrl);
      } catch (_) {}
      try {
        if (wrapperBlobUrl) URL.revokeObjectURL(wrapperBlobUrl);
      } catch (_) {}
      try {
        const win = iframe.contentWindow;
        if (win) {
          win.removeEventListener("error", errorHandler);
          win.removeEventListener("unhandledrejection", rejectionHandler);
          // remove the exposed resolvers if present
          try {
            delete win.__runInFrameDone;
          } catch (_) {}
          try {
            delete win.__runInFrameDoneResolve;
          } catch (_) {}
          try {
            delete win.__runInFrameDoneReject;
          } catch (_) {}
        }
      } catch (_) {}
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

        for (const k of Object.keys(endowments)) {
          try {
            win[k] = endowments[k];
          } catch (e) { /* ignore */ }
        }

        let resolveInner, rejectInner;
        const donePromise = new Promise((res, rej) => {
          resolveInner = res;
          rejectInner = rej;
        });

        win.__runInFrameDone = donePromise;
        win.__runInFrameDoneResolve = resolveInner;
        win.__runInFrameDoneReject = rejectInner;

        const userBlob = new Blob([code], { type: "text/javascript" });
        userBlobUrl = URL.createObjectURL(userBlob);

        const wrapperCode = `
          (async () => {
            try {
              const ns = await import(${JSON.stringify(userBlobUrl)});
              if (window && typeof window.__runInFrameDoneResolve === "function") {
                try { window.__runInFrameDoneResolve(ns); } catch(e) { /* swallow */ }
              }
              return ns;
            } catch (err) {
              if (window && typeof window.__runInFrameDoneReject === "function") {
                try { window.__runInFrameDoneReject(err); } catch(e) { /* swallow */ }
              }
              throw err;
            }
          })();
        `;
        const wrapperBlob = new Blob([wrapperCode], { type: "text/javascript" });
        wrapperBlobUrl = URL.createObjectURL(wrapperBlob);

        const script = doc.createElement("script");
        script.type = "module";
        script.src = wrapperBlobUrl;

        script.onerror = onScriptError;

        doc.body.appendChild(script);

        donePromise.then((moduleNamespace) => {
          resolveOnce({ iframe, window: win, document: doc, module: moduleNamespace });
        }).catch((err) => {
          doOnErrorCallback(err);
          rejectOnce(err);
        });
      } catch (err) {
        doOnErrorCallback(err);
        rejectOnce(err);
      }
    };

    iframe.addEventListener("load", onLoad);
    document.body.appendChild(iframe);
  });
}

function showFinishOverlay() {
  const existing = document.getElementById("finish-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "finish-overlay";

  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0, 180, 0, 0.85)";
  overlay.style.color = "white";
  overlay.style.zIndex = "999999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.fontFamily = "monospace";
  overlay.style.boxSizing = "border-box";
  overlay.style.fontSize = "48px";
  overlay.style.fontWeight = "bold";

  const text = document.createElement("div");
  text.textContent = "Finished";

  overlay.appendChild(text);
  document.body.appendChild(overlay);
}

function showErrorOverlay(err) {
  if (!err) return;

  const existing = document.getElementById("error-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "error-overlay";

  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(255, 0, 0, 0.85)";
  overlay.style.color = "white";
  overlay.style.zIndex = "999999";
  overlay.style.padding = "20px";
  overlay.style.fontFamily = "monospace";
  overlay.style.overflow = "auto";
  overlay.style.boxSizing = "border-box";

  const container = document.createElement("div");
  container.style.maxWidth = "900px";
  container.style.margin = "40px auto";

  const title = document.createElement("h1");
  title.textContent = "Error";
  title.style.marginTop = "0";

  const messageEl = document.createElement("pre");
  messageEl.textContent = err.message || String(err);

  const stackEl = document.createElement("pre");
  stackEl.textContent = err.stack || "(no stack trace available)";
  stackEl.style.marginTop = "20px";

  container.appendChild(title);
  container.appendChild(messageEl);
  container.appendChild(stackEl);

  overlay.appendChild(container);
  document.body.appendChild(overlay);
}

const response = await fetch("/bundle.js");
const code = await response.text();

let interval = null;

const canvas = document.getElementById("sim");

const sim = {
  log: (...args) => {
    console.log(...args);

    fetch("/log", {
      method: "POST",
      keepalive: true,
      body: args.map((arg) => typeof arg === "string" ? arg : JSON.stringify(arg)).join("\t"),
      headers: { "Content-Type": "application/json" },
    });
  },
  finish: () => {
    fetch("/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (interval != null) {
      clearInterval(interval);
    }
    showFinishOverlay();
    waitForNext();
  },
  ctx: canvas.getContext("2d"),
  frame: 0,
  resizeCanvas: (width, height) => {
    const canvas = document.getElementById("sim");
    canvas.width = width;
    canvas.height = height;
  },
  addSound: async (soundProps) => {
    const res = await fetch("/addSound", {
      method: "POST",
      body: JSON.stringify(soundProps),
      headers: { "Content-Type": "application/json" },
    });

    return parseInt(await res.text());
  },
  playSound: (sound) => {
    fetch("/playSound", {
      method: "POST",
      body: sound.toString(),
      headers: { "Content-Type": "application/json" },
    });
  },
  addFetchAsset: async (path, fetchAddr) => {
    await fetch("/addFetchAsset", {
      method: "POST",
      body: JSON.stringify({ path, fetchAddr }),
      headers: { "Content-Type": "application/json" },
    });
  },
};

fetch("/begin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
});

function errorHandler(err) {
  console.error(err);
  showErrorOverlay(err);

  fetch("/err", {
    method: "POST",
    body: err.message,
    headers: { "Content-Type": "application/json" },
  });

  waitForNext();
}

runInFrame(code, { sim }, errorHandler).then((val) => {
  window.simFrame = val;
  console.log(sim.onUpdate);
  if (sim.onUpdate) {
    interval = setInterval(() => {
      sim.onUpdate();

      if (SHOULD_RECORD) {
        canvas.toBlob(async (blob) => {
          await fetch("/frame", { method: "POST", body: blob });
        }, "image/png");
      }

      sim.frame += 1;
    }, 1000 / 60);
  }
});

function waitForNext() {
  setInterval(() => {
    fetch("/ping").then(() => {
      location.reload();
    });
  }, 300);
}

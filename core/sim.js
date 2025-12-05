import "https://cdn.jsdelivr.net/npm/ses@0.15.3/dist/ses.umd.min.js";

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
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    });
    if (interval != null) {
      clearInterval(interval);
    }
    showFinishOverlay();
  },
  ctx: canvas.getContext("2d"),
  frame: 0,
  resizeCanvas: (width, height) => {
    const canvas = document.getElementById("sim");
    canvas.width = width;
    canvas.height = height;
  },
};

const compartment = new Compartment({
  sim,
});

fetch("/begin", {
  method: "POST",
  keepalive: true,
  headers: { "Content-Type": "application/json" },
});

try {
  compartment.evaluate(code);

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
} catch (err) {
  console.error(err);
  showErrorOverlay(err);

  fetch("/err", {
    method: "POST",
    keepalive: true,
    body: err.message,
    headers: { "Content-Type": "application/json" },
  });
}

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

const yieldChannel = new MessageChannel();
let yieldResolve = null;
yieldChannel.port1.onmessage = () => {
  if (yieldResolve) yieldResolve();
};

let interval = null;
let pingInterval = null;
let isFinished = false;
let frameCount = 0;
let framesThisSecond = 0;
let currentFPS = 0;
let currentFrameTime = 0;
let lastFrameTime = 0;
let fpsTimer = null;

const __profiling = {
  enabled: typeof PROFILING !== "undefined" && PROFILING,
  stack: [],
  stats: new Map(),

  enter(name) {
    if (!this.enabled) return;
    const parentName = this.stack.length > 0 ? this.stack[this.stack.length - 1].fullName : null;
    const fullName = parentName ? `${parentName} > ${name}` : name;
    this.stack.push({ name, fullName, start: performance.now() });
  },

  exit() {
    if (!this.enabled) return;
    if (!this.stack.length) {
      throw new Error("Profiling error: __PROFILE_EXIT called without matching __PROFILE_ENTER");
    }
    const frame = this.stack.pop();
    const duration = performance.now() - frame.start;

    let stat = this.stats.get(frame.fullName);
    if (!stat) {
      stat = {
        total: 0,
        calls: 0,
        min: Infinity,
        max: 0,
        last: 0,
        displayName: frame.name,
      };
      this.stats.set(frame.fullName, stat);
    }
    stat.total += duration;
    stat.calls++;
    stat.min = Math.min(stat.min, duration);
    stat.max = Math.max(stat.max, duration);
    stat.last = duration;
  },

  getStats() {
    if (this.stack.length > 0) {
      const remaining = this.stack.map(s => s.fullName).join(", ");
      throw new Error(`Profiling error: ${this.stack.length} unclosed profiling region(s) remain: ${remaining}`);
    }
    const result = [];
    for (const [fullName, stat] of this.stats) {
      result.push({ fullName, ...stat });
    }
    return result.sort((a, b) => b.total - a.total);
  },

  reset() {
    this.stats.clear();
    this.stack = [];
  },
};

const canvas = document.getElementById("sim");
const hiddenCanvas = document.createElement("canvas");
hiddenCanvas.width = canvas.width;
hiddenCanvas.height = canvas.height;
const hiddenCtx = hiddenCanvas.getContext("2d");

const gl = canvas.getContext("webgl", { alpha: false, preserveDrawingBuffer: true });
if (!gl) {
  throw new Error("WebGL not supported");
}

const shaders = new Map();
let nextShaderId = 1;

const quadBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1, 0, 0,
   1, -1, 1, 0,
  -1,  1, 0, 1,
  -1,  1, 0, 1,
   1, -1, 1, 0,
   1,  1, 1, 1,
]), gl.STATIC_DRAW);

const defaultVertexShader = `
attribute vec2 position;
attribute vec2 texCoord;
varying vec2 v_texCoord;
void main() {
  gl_Position = vec4(position, 0, 1);
  v_texCoord = texCoord;
}
`;

const defaultFragmentShader = `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
void main() {
  gl_FragColor = texture2D(u_image, v_texCoord);
}
`;

function createProgram(vSource, fSource) {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vSource);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(vs));
  }

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fSource);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(fs));
  }

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }

  return program;
}

const defaultProgram = createProgram(defaultVertexShader, defaultFragmentShader);
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

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
    }).catch(() => {});
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
  ctx: hiddenCtx,
  clear: (color) => {
    let r = 0, g = 0, b = 0, a = 1;
    if (typeof color === "string") {
      if (color.startsWith("#")) {
        const hex = color.slice(1);
        if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16) / 255;
          g = parseInt(hex[1] + hex[1], 16) / 255;
          b = parseInt(hex[2] + hex[2], 16) / 255;
        } else if (hex.length === 6) {
          r = parseInt(hex.slice(0, 2), 16) / 255;
          g = parseInt(hex.slice(2, 4), 16) / 255;
          b = parseInt(hex.slice(4, 6), 16) / 255;
        }
      } else if (color.startsWith("rgb")) {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
          r = parseInt(match[1]) / 255;
          g = parseInt(match[2]) / 255;
          b = parseInt(match[3]) / 255;
          if (match[4]) a = parseFloat(match[4]);
        }
      }
    }
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
  },
  resizeCanvas: (width, height) => {
    canvas.width = width;
    canvas.height = height;
    hiddenCanvas.width = width;
    hiddenCanvas.height = height;
    gl.viewport(0, 0, width, height);
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
      body: JSON.stringify({ sound, frame: frameCount }),
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

  createShader: (descriptor) => {
    const id = nextShaderId++;
    const program = createProgram(descriptor.vertex || defaultVertexShader, descriptor.fragment);
    
    const uniformLocations = new Map();
    if (descriptor.uniforms) {
      for (const name in descriptor.uniforms) {
        uniformLocations.set(name, gl.getUniformLocation(program, name));
      }
    }

    shaders.set(id, {
      program,
      uniforms: descriptor.uniforms || {},
      uniformLocations,
      blend: descriptor.blend || "alpha"
    });
    return id;
  },

  applyShader: (shaderId, runtimeUniforms = {}) => {
    const shader = shaders.get(shaderId);
    const program = shader ? shader.program : defaultProgram;
    const uniformLocations = shader ? shader.uniformLocations : new Map();
    const baseUniforms = shader ? shader.uniforms : {};
    const blend = shader ? shader.blend : "alpha";

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    if (shaderId !== 0) {
      // 1. Flush 2D to WebGL using default program
      gl.useProgram(defaultProgram);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hiddenCanvas);
      
      const uImgLocDefault = gl.getUniformLocation(defaultProgram, "u_image");
      if (uImgLocDefault !== null) gl.uniform1i(uImgLocDefault, 0);

      const posLoc = gl.getAttribLocation(defaultProgram, "position");
      const texLoc = gl.getAttribLocation(defaultProgram, "texCoord");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(texLoc);
      gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8);
      
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);

      // 2. Copy the result back to texture for processing
      gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, canvas.width, canvas.height, 0);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hiddenCanvas);
    }

    // Apply the requested shader
    gl.useProgram(program);
    
    const positionLoc = gl.getAttribLocation(program, "position");
    const texCoordLoc = gl.getAttribLocation(program, "texCoord");
    if (positionLoc !== -1) {
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
    }
    if (texCoordLoc !== -1) {
      gl.enableVertexAttribArray(texCoordLoc);
      gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);
    }

    for (const [name, location] of uniformLocations) {
      const def = baseUniforms[name];
      if (!def) continue;
      const value = runtimeUniforms[name] !== undefined ? runtimeUniforms[name] : def.value;
      
      if (def.type === "float") gl.uniform1f(location, value);
      else if (def.type === "vec2") gl.uniform2fv(location, value);
      else if (def.type === "vec3") gl.uniform3fv(location, value);
      else if (def.type === "vec4") gl.uniform4fv(location, value);
      else if (def.type === "int") gl.uniform1i(location, value);
      else if (def.type === "bool") gl.uniform1i(location, value ? 1 : 0);
      else if (def.type === "sampler2D") gl.uniform1i(location, 0);
    }

    const uImageLoc = gl.getUniformLocation(program, "u_image");
    if (uImageLoc !== null) gl.uniform1i(uImageLoc, 0);

    if (blend === "alpha") {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    } else if (blend === "add") {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
    } else if (blend === "multiply") {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.DST_COLOR, gl.ZERO);
    } else if (blend === "screen") {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
    } else {
      gl.disable(gl.BLEND);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
  }
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
    body: JSON.stringify({
      message: err.message || String(err),
      stack: err.stack || "",
    }),
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});

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
  }).catch(() => {});
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
      currentFrameTime = currentFPS > 0 ? 1000 / currentFPS : 0;
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

        const result = onUpdate();
        if (result instanceof Promise) {
          await result.catch(errorHandler);
        }
        sim.applyShader(0);
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

    let nextFrameTime = performance.now();

    const runLoop = async () => {
      while (running) {
        const frameStart = performance.now();
        if (lastFrameTime > 0) {
          currentFrameTime = frameStart - lastFrameTime;
        }
        lastFrameTime = frameStart;

        await runFrame();

        yieldChannel.port2.postMessage(null);
        await new Promise((resolve) => {
          yieldResolve = resolve;
        });

        if (!NO_THROTTLE && running) {
          const targetFrameTime = 1000 / 60;
          nextFrameTime += targetFrameTime;
          const sleepTime = nextFrameTime - performance.now();
          if (sleepTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, sleepTime));
          }
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

const debug = document.getElementById("debug");
const debugBtn = document.getElementById("debugBtn");
const closeDebugBtn = document.getElementById("closeDebugBtn");
const debugFrame = document.getElementById("debugFrame");
const debugTime = document.getElementById("debugTime");
const debugFPS = document.getElementById("debugFPS");
const debugFrameTime = document.getElementById("debugFrameTime");

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
  if (debugFrameTime) {
    if (interval === null) {
      debugFrameTime.textContent = "not running";
    } else {
      debugFrameTime.textContent = currentFrameTime.toFixed(2) + "ms";
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
          const avgCalls = (stat.calls / frameCount).toFixed(2);
          const indent = (stat.fullName.match(/>/g) || []).length * 16;
          return `<div class="debug-profiling-item" style="padding-left: ${indent}px;">
          <div class="debug-profiling-name">${stat.fullName}</div>
          <div class="debug-profiling-stats">${avgCalls} avg calls | ${avg}ms avg | ${
            stat.total.toFixed(
              2,
            )
          }ms total (${percent}%)</div>
        </div>`;
        })
        .join("");
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

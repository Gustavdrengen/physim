import { __profiling } from "./profiling.ts";
import {
  canvas,
  createProgram,
  defaultProgram,
  defaultVertexShader,
  fixCanvasDisplay,
  getProgramLocations,
  gl,
  hiddenCanvas,
  hiddenCtx,
  programs,
  quadBuffer,
  readTexture,
  setupPingPongTextures,
  type ShaderConfig,
  shaders,
  showCanvasWebGL,
  swapPingPong,
  writeFramebuffer,
} from "./webgl.ts";
import {
  activateShaderMode,
  frameCountState,
  frameState,
  getFpsTimer,
  getNextProgramId,
  getNextShaderId,
  getPingInterval,
  getRunResolve,
  isShaderModeActive,
  markShaderRun,
  setClearColor,
  setFpsTimer,
  setPingInterval,
  setRunResolve,
} from "./state.ts";

let yieldChannel: MessageChannel;
let yieldResolve: (() => void) | null = null;

export function initYieldChannel(): void {
  yieldChannel = new MessageChannel();
  yieldChannel.port1.onmessage = () => {
    if (yieldResolve) yieldResolve();
  };
}

export function sendYield(): void {
  yieldChannel.port2.postMessage(null);
}

export function waitForYield(): Promise<void> {
  return new Promise((resolve) => {
    yieldResolve = resolve;
  });
}

export function stopSimulation(): void {
  if (getPingInterval() !== null) {
    clearInterval(getPingInterval());
    setPingInterval(null);
  }
  if (getFpsTimer() !== null) {
    clearInterval(getFpsTimer());
    setFpsTimer(null);
  }
  if (sim._stopRunning) {
    sim._stopRunning();
  }
  updateDebugWindow();
}

export type DebugUpdateFn = () => void;
export let updateDebugWindow: DebugUpdateFn = () => {};

export function setDebugUpdateFn(fn: DebugUpdateFn): void {
  updateDebugWindow = fn;
}

export function getFrameCount(): number {
  return frameCountState.frameCount;
}

export function getCurrentFPS(): number {
  return frameCountState.currentFPS;
}

export const sim: {
  log: (...args: unknown[]) => void;
  finish: () => void;
  ctx: CanvasRenderingContext2D;
  document: Document;
  clear: (color?: string) => void;
  resizeCanvas: (width: number, height: number) => void;
  addSound: (soundProps: unknown) => Promise<number>;
  playSound: (sound: number) => void;
  addFetchAsset: (path: string, fetchAddr: string) => Promise<void>;
  __PROFILE_ENTER: (name: string) => void;
  __PROFILE_EXIT: () => void;
  createShaderProgram: (fragment: string, vertex?: string) => number;
  createShader: (programId: number, config?: ShaderConfig) => number;
  setShaderUniforms: (
    shaderId: number,
    newUniforms: Record<string, { type: string; value: unknown }>,
  ) => void;
  applyShader: (shaderId: number) => void;
  run: (onUpdate: () => unknown) => Promise<void>;
  _stopRunning?: () => void;
} = {
  log: (...args: unknown[]) => {
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
    stopSimulation();
    const rr = getRunResolve();
    if (rr) {
      rr();
      setRunResolve(null);
    }
  },
  document: window.parent.document,
  clear: (color?: string) => {
    let r = 0,
      g = 0,
      b = 0,
      a = 1;
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
        const match = color.match(
          /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/,
        );
        if (match) {
          r = parseInt(match[1]!) / 255;
          g = parseInt(match[2]!) / 255;
          b = parseInt(match[3]!) / 255;
          if (match[4]) a = parseFloat(match[4]!);
        }
      }
    }
    // Store clear color for 2D mode fills
    setClearColor(r, g, b, a);

    if (isShaderModeActive()) {
      gl.clearColor(r, g, b, a);
      gl.clear(gl.COLOR_BUFFER_BIT);
    } else {
      // 2D mode: fill the visible canvas directly
      hiddenCtx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
      hiddenCtx.fillRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
    }
  },
  resizeCanvas: (width: number, height: number) => {
    canvas.width = width;
    canvas.height = height;
    hiddenCanvas.width = width;
    hiddenCanvas.height = height;
    gl.viewport(0, 0, width, height);
    setupPingPongTextures();
    fixCanvasDisplay();
  },
  addSound: async (soundProps: unknown) => {
    try {
      const res = await fetch("/addSound", {
        method: "POST",
        body: JSON.stringify(soundProps),
        headers: { "Content-Type": "application/json" },
      });
      return parseInt(await res.text());
    } catch {
      return -1;
    }
  },
  playSound: (sound: number) => {
    fetch("/playSound", {
      method: "POST",
      body: JSON.stringify({ sound, frame: frameCountState.frameCount }),
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  },
  addFetchAsset: async (path: string, fetchAddr: string) => {
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
  __PROFILE_ENTER: (name: string) => {
    __profiling.enter(name);
  },
  __PROFILE_EXIT: () => {
    __profiling.exit();
  },

  createShaderProgram: (fragment: string, vertex?: string) => {
    const id = getNextProgramId();
    const program = createProgram(vertex ?? defaultVertexShader, fragment);
    programs.set(id, program);
    return id;
  },

  createShader: (programId: number, config: ShaderConfig = {}) => {
    const program = programs.get(programId);
    if (!program) throw new Error("Invalid program id");

    const id = getNextShaderId();
    const uniformLocations = new Map<string, WebGLUniformLocation | null>();
    const uniforms = config.uniforms || {};

    for (const name in uniforms) {
      uniformLocations.set(name, gl.getUniformLocation(program, name));
    }

    shaders.set(id, {
      programId,
      uniforms: { ...uniforms },
      uniformLocations,
      blend: config.blend || "alpha",
    });
    return id;
  },

  setShaderUniforms: (
    shaderId: number,
    newUniforms: Record<string, { type: string; value: unknown }>,
  ) => {
    const shader = shaders.get(shaderId);
    if (!shader) throw new Error("Invalid shader id");

    const program = programs.get(shader.programId);
    if (!program) return;

    for (const name in newUniforms) {
      shader.uniforms[name] = newUniforms[name];
      // Only query location if not already cached
      if (!shader.uniformLocations.has(name)) {
        shader.uniformLocations.set(
          name,
          gl.getUniformLocation(program, name),
        );
      }
    }
  },

  applyShader: (_shaderId: number) => {
    const shader = shaders.get(_shaderId);
    const programId = shader ? shader.programId : null;
    const program = programId ? programs.get(programId) : defaultProgram;

    const uniformLocations = shader
      ? shader.uniformLocations
      : new Map<string, WebGLUniformLocation | null>();
    const uniforms = shader ? shader.uniforms : {};
    const blend = shader ? shader.blend : "alpha";

    // Transition from 2D mode to WebGL mode on first shader use
    if (!isShaderModeActive()) {
      activateShaderMode();
      showCanvasWebGL();
    }

    if (frameState.firstShaderInFrame) {
      gl.bindTexture(gl.TEXTURE_2D, readTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        hiddenCanvas,
      );
      frameState.firstShaderInFrame = false;
    }

    frameState.anyShaderRun = true;
    markShaderRun();

    gl.bindFramebuffer(gl.FRAMEBUFFER, writeFramebuffer);

    const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (fbStatus !== gl.FRAMEBUFFER_COMPLETE) {
      console.error("Framebuffer incomplete:", fbStatus);
      return;
    }

    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, readTexture);

    // Use cached locations instead of querying every frame
    const locs = getProgramLocations(program);
    if (locs.uImage !== null) {
      gl.uniform1i(locs.uImage, 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);

    if (locs.position !== -1) {
      gl.enableVertexAttribArray(locs.position);
      gl.vertexAttribPointer(locs.position, 2, gl.FLOAT, false, 16, 0);
    }

    if (locs.texCoord !== -1) {
      gl.enableVertexAttribArray(locs.texCoord);
      gl.vertexAttribPointer(locs.texCoord, 2, gl.FLOAT, false, 16, 8);
    }

    for (const [name, location] of uniformLocations) {
      const def = uniforms[name];
      if (!def) continue;

      const value = def.value;

      if (def.type === "float") gl.uniform1f(location, value as number);
      else if (def.type === "vec2") {
        gl.uniform2fv(location, value as Float32Array);
      } else if (def.type === "vec3") {
        gl.uniform3fv(location, value as Float32Array);
      } else if (def.type === "vec4") {
        gl.uniform4fv(location, value as Float32Array);
      } else if (def.type === "int") gl.uniform1i(location, value as number);
      else if (def.type === "bool") gl.uniform1i(location, value ? 1 : 0);
      else if (def.type === "sampler2D") gl.uniform1i(location, 0);
    }

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

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    swapPingPong();
  },
  ctx: null! as unknown as CanvasRenderingContext2D,
  run: null! as unknown as (onUpdate: () => unknown) => Promise<void>,
};

let writeToTerminalFn: (text: string) => void = (_text: string) => {
  // Will be set by UI module
};

export function setWriteToTerminal(fn: (text: string) => void): void {
  writeToTerminalFn = fn;
}

function writeToTerminal(text: string): void {
  writeToTerminalFn(text);
}

// Force TypeScript to treat this as a module
export {};

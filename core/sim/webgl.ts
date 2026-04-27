export interface ShaderConfig {
  uniforms?: Record<string, { type: string; value: unknown }>;
  blend?: string;
}

export interface Shader {
  programId: number;
  uniforms: Record<string, { type: string; value: unknown }>;
  uniformLocations: Map<WebGLUniformLocation | null, string>;
  blend: string;
}

export const canvas = document.getElementById("sim") as HTMLCanvasElement;
export const hiddenCanvas = document.createElement("canvas");
hiddenCanvas.width = canvas.width;
hiddenCanvas.height = canvas.height;
export const hiddenCtx = hiddenCanvas.getContext("2d")!;

export const gl = canvas.getContext("webgl", {
  alpha: false,
  preserveDrawingBuffer: true,
})!;

if (!gl) {
  throw new Error("WebGL not supported");
}

export const programs = new Map<number, WebGLProgram>();

export const shaders = new Map<number, Shader>();

export const quadBuffer = gl.createBuffer()!;
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, -1, 1, 0, 1, 1, -1, 1, 0, 1, 1, 1,
    1,
  ]),
  gl.STATIC_DRAW,
);

export const defaultVertexShader = `
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

export function createProgram(vSource: string, fSource: string): WebGLProgram {
  const vs = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vs, vSource);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    throw new Error(
      gl.getShaderInfoLog(vs) ?? "Vertex shader compilation failed",
    );
  }

  const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fs, fSource);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    throw new Error(
      gl.getShaderInfoLog(fs) ?? "Fragment shader compilation failed",
    );
  }

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Program linking failed");
  }

  return program;
}

export const defaultProgram = createProgram(
  defaultVertexShader,
  defaultFragmentShader,
);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

// Offscreen framebuffer for shader processing
export const offscreenFramebuffer = gl.createFramebuffer()!;
let offscreenTexture = gl.createTexture()!;

function setupOffscreenTexture(): void {
  gl.bindTexture(gl.TEXTURE_2D, offscreenTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    canvas.width,
    canvas.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, offscreenFramebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    offscreenTexture,
    0,
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
setupOffscreenTexture();

// Ping-pong textures and framebuffers
export let readTexture = gl.createTexture();
export let writeTexture = gl.createTexture();
export let readFramebuffer = gl.createFramebuffer();
export let writeFramebuffer = gl.createFramebuffer();

export function setupPingPongTextures(): void {
  const width = canvas.width;
  const height = canvas.height;

  for (const tex of [readTexture, writeTexture]) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, readFramebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    readTexture,
    0,
  );

  gl.bindFramebuffer(gl.FRAMEBUFFER, writeFramebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    writeTexture,
    0,
  );

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
setupPingPongTextures();

export const copyProgram = defaultProgram;

export function fixCanvasDisplay(): void {
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

export function swapPingPong(): void {
  [readTexture, writeTexture] = [writeTexture, readTexture];
  [readFramebuffer, writeFramebuffer] = [writeFramebuffer, readFramebuffer];
}

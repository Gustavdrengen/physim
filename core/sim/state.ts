export interface FrameState {
  needsFlush: boolean;
  anyShaderRun: boolean;
  firstShaderInFrame: boolean;
}

export interface FrameCountState {
  frameCount: number;
  framesThisSecond: number;
  currentFPS: number;
  currentFrameTime: number;
  lastFrameTime: number;
}

export interface ShaderIds {
  nextProgramId: number;
  nextShaderId: number;
}

export const frameState: FrameState = {
  needsFlush: false,
  anyShaderRun: false,
  firstShaderInFrame: true,
};

export const frameCountState: FrameCountState = {
  frameCount: 0,
  framesThisSecond: 0,
  currentFPS: 0,
  currentFrameTime: 0,
  lastFrameTime: 0,
};

export const shaderIds: ShaderIds = {
  nextProgramId: 1,
  nextShaderId: 1,
};

let isFinished = false;
let pingInterval: ReturnType<typeof setInterval> | null = null;
let fpsTimer: ReturnType<typeof setInterval> | null = null;
let runResolve: (() => void) | null = null;

export function getIsFinished(): boolean {
  return isFinished;
}

export function setIsFinished(val: boolean): void {
  isFinished = val;
}

export function getPingInterval(): typeof pingInterval {
  return pingInterval;
}

export function setPingInterval(val: typeof pingInterval): void {
  pingInterval = val;
}

export function getFpsTimer(): typeof fpsTimer {
  return fpsTimer;
}

export function setFpsTimer(val: typeof fpsTimer): void {
  fpsTimer = val;
}

export function getRunResolve(): (() => void) | null {
  return runResolve;
}

export function setRunResolve(val: (() => void) | null): void {
  runResolve = val;
}

export function resetFrameCountState(): void {
  frameCountState.frameCount = 0;
  frameCountState.framesThisSecond = 0;
  frameCountState.currentFPS = 0;
  frameCountState.currentFrameTime = 0;
  frameCountState.lastFrameTime = 0;
}

export function incrementFrameCount(): void {
  frameCountState.frameCount++;
  frameCountState.framesThisSecond++;
}

export function updateFPS(): void {
  frameCountState.currentFPS = frameCountState.framesThisSecond;
  frameCountState.currentFrameTime =
    frameCountState.currentFPS > 0 ? 1000 / frameCountState.currentFPS : 0;
  frameCountState.framesThisSecond = 0;
}

export function getCurrentFrameTime(): number {
  return frameCountState.currentFrameTime;
}

export function updateLastFrameTime(time: number): void {
  if (frameCountState.lastFrameTime > 0) {
    frameCountState.currentFrameTime = time - frameCountState.lastFrameTime;
  }
  frameCountState.lastFrameTime = time;
}

export function resetFrameState(): void {
  frameState.needsFlush = true;
  frameState.anyShaderRun = false;
  frameState.firstShaderInFrame = true;
}

export function markShaderRun(): void {
  frameState.anyShaderRun = true;
  frameState.firstShaderInFrame = false;
}

export function flushComplete(): void {
  frameState.needsFlush = false;
  frameState.anyShaderRun = false;
}

export function markNeedsFlush(): void {
  frameState.needsFlush = true;
}

export function getNextProgramId(): number {
  return shaderIds.nextProgramId++;
}

export function getNextShaderId(): number {
  return shaderIds.nextShaderId++;
}

export function resetShaderIds(): void {
  shaderIds.nextProgramId = 1;
  shaderIds.nextShaderId = 1;
}

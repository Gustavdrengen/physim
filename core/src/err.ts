import { isRawModeEnabled } from "./print.ts";
import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping";
import { relative, resolve } from "@std/path";

const EX_UNAVAILABLE = 69;
const EX_SOFTWARE = 70;
const EX_DATAERR = 65;

function error(tag: string, err: string, code: number) {
  if (isRawModeEnabled()) {
    console.error(`[${tag}] ${err}`);
  } else {
    console.error(
      `%c[${tag}]%c ${err}`,
      "background-color: red; font-weight: bold;",
      "color: red;",
    );
  }

  Deno.exit(code);
}

function errorHandler(err: Error) {
  error("UNEXPECTED", err.message, EX_SOFTWARE);
}

export function setGlobalErrorHandler() {
  globalThis.onerror = (e) => errorHandler(e.error);
  globalThis.onunhandledrejection = (e) => errorHandler(e.reason);
}

export enum InputFailureTag {
  EntryPointNotFoundFailure = "ENTRY_POINT_NOT_FOUND_FAILURE",
  TsConfigMissingFailure = "TS_CONFIG_MISSING_FAILURE",
  TypeCheckFailure = "TYPE_CHECK_FAILURE",
  BuildFailure = "BUILD_FAILURE",
  RuntimeFailure = "RUNTIME_FAILURE",
  AssetFailure = "ASSET_FAILURE",
  AssetFetchFailure = "ASSET_FETCH_FAILURE",
  SoundFailure = "SOUND_FAILURE",
  RestrictionFailure = "RESTRICTION_FAILURE",
}

export enum SystemFailureTag {
  DependencyFailure = "DEPENDENCY_FAILURE",
  CantOpenFileFailure = "CANT_OPEN_FILE_FAILURE",
  MultibleClientsFailure = "MULTIBLE_CLIENTS_FAILURE",
  OpenFailure = "OPEN_FAILURE",
  FfmpegFailure = "FFMPEG_FAILURE",
  NetworkFailure = "NETWORK_FAILURE",
  MidiSynthesisFailure = "MIDI_SYNTHESIS_FAILURE",
  AudioPlaybackFailure = "AUDIO_PLAYBACK_FAILURE",
  SoxSynthesisFailure = "SOX_SYNTHESIS_FAILURE",
}

export type Failure = {
  _isFailure: true;
  tag: InputFailureTag | SystemFailureTag;
  reason: string;
};

export function fail(
  tag: InputFailureTag | SystemFailureTag,
  reason: string,
): Failure {
  return { _isFailure: true, tag, reason };
}

export type Result<T> = T | Failure;

export function unwrap<T>(result: Result<T>): T {
  if (typeof result === "object" && result !== null && "_isFailure" in result) {
    const isInputFailure = Object.values(InputFailureTag).includes(
      result.tag as InputFailureTag,
    );
    const isSystemFailure = Object.values(SystemFailureTag).includes(
      result.tag as SystemFailureTag,
    );

    let code;
    if (isInputFailure) {
      code = EX_DATAERR;
    } else if (isSystemFailure) {
      code = EX_UNAVAILABLE;
    } else {
      throw Error("bruh wtf");
    }

    error(result.tag, result.reason, code);
  }

  return result as T;
}

export function failed<T>(result: Result<T>): boolean {
  return (
    typeof result === "object" && result !== null && "_isFailure" in result
  );
}

type StackFrame = {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  functionName: string;
};

function parseStack(stack: string): StackFrame[] {
  const frames: StackFrame[] = [];
  const lines = stack.split("\n");

  for (const line of lines) {
    // Format: "at funcName (file:line:col)"
    let match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match && match[1] && match[2] && match[3] && match[4]) {
      frames.push({
        functionName: match[1],
        fileName: match[2],
        lineNumber: parseInt(match[3]),
        columnNumber: parseInt(match[4]),
      });
      continue;
    }

    // Format: "at file:line:col"
    match = line.match(/at\s+(.+?):(\d+):(\d+)/);
    if (match && match[1] && match[2] && match[3]) {
      frames.push({
        functionName: "<anonymous>",
        fileName: match[1],
        lineNumber: parseInt(match[2]),
        columnNumber: parseInt(match[3]),
      });
      continue;
    }

    // Firefox/blob format: "funcName@url:line:col" or "@url:line:col"
    match = line.match(/^(.*?)@(.*?):(\d+):(\d+)$/);
    if (match && match[2] && match[3] && match[4]) {
      frames.push({
        functionName: match[1] || "<anonymous>",
        fileName: match[2],
        lineNumber: parseInt(match[3]),
        columnNumber: parseInt(match[4]),
      });
      continue;
    }
  }

  return frames;
}

function translateStack(
  frames: StackFrame[],
  traceMap: TraceMap,
  bundleDir: string,
): StackFrame[] {
  return frames.map((frame) => {
    const original = originalPositionFor(traceMap, {
      line: frame.lineNumber,
      column: frame.columnNumber,
    });

    if (original.source) {
      // Resolve the source map path to absolute, then make relative to bundleDir
      const absSource = resolve(bundleDir, original.source);
      const relSource = relative(bundleDir, absSource);
      return {
        fileName: relSource,
        lineNumber: original.line ?? frame.lineNumber,
        columnNumber: original.column ?? frame.columnNumber,
        functionName: original.name ?? frame.functionName,
      };
    }

    return frame;
  });
}

export function formatStackTrace(
  stack: string,
  traceMap: TraceMap | null,
  maxTraceback: number,
  baseDir: string,
  bundleDir: string,
): string {
  let frames = parseStack(stack);

  if (traceMap) {
    frames = translateStack(frames, traceMap, bundleDir);
  }

  // Normalize paths: strip URLs, resolve to absolute, make relative to baseDir
  frames = frames.map((f) => {
    let fileName = f.fileName;
    // Strip blob/http URLs
    fileName = fileName.replace(/^blob:[^/]+\/\//, "").replace(/^https?:\/\/[^/]+/, "");
    // Resolve to absolute (source map paths are relative to bundle dir)
    const absPath = resolve(bundleDir, fileName);
    // Make relative to baseDir
    const rel = relative(baseDir, absPath);
    fileName = rel;
    return { ...f, fileName };
  });

  // Find the first user-code frame (not in std/)
  let startIndex = 0;
  for (let i = 0; i < frames.length; i++) {
    const fileName = frames[i]?.fileName ?? "";
    if (!fileName.includes("/std/") && !fileName.includes("node_modules")) {
      startIndex = i;
      break;
    }
  }

  // Take up to maxTraceback frames from the first user frame
  const displayFrames = frames.slice(startIndex, startIndex + maxTraceback);

  return displayFrames
    .map((f) => {
      const namePart =
        f.functionName && f.functionName !== "<anonymous>"
          ? `${f.functionName} at `
          : "at ";
      return `${namePart}${f.fileName}(${f.lineNumber},${f.columnNumber})`;
    })
    .join("\n");
}

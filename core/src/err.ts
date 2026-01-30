const EX_UNAVAILABLE = 69;
const EX_SOFTWARE = 70;
const EX_DATAERR = 65;

let rawMode = false;

export function enableRawMode() {
  rawMode = true;
}

function error(tag: string, err: string, code: number) {
  if (rawMode) {
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
  TypeCheckFailure = "TYPE_CHECK_FAILURE",
  BuildFailure = "BUILD_FAILURE",
  RuntimeFailure = "RUNTIME_FAILURE",
  AssetFailure = "ASSET_FAILURE",
  AssetFetchFailure = "ASSET_FETCH_FAILURE",
  SoundFailure = "SOUND_FAILURE",
}

export enum SystemFailureTag {
  DependencyFailure = "DEPENDENCY_FAILURE",
  CantOpenFileFailure = "CANT_OPEN_FILE_FAILURE",
  MultibleClientsFailure = "MULTIBLE_CLIENTS_FAILURE",
  OpenFailure = "OPEN_FAILURE",
  FfmpegFailure = "FFMPEG_FAILURE",
  NetworkFailure = "NETWORK_FAILURE",
  MidiSynthesisFailure = "MIDI_SYNTHESIS_FAILURE",
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

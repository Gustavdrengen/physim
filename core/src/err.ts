const EX_UNAVAILABLE = 69;
const EX_SOFTWARE = 70;
const EX_DATAERR = 65;

function errorHandler(err: Error) {
  console.error("Unexpected internal error:", err);
  Deno.exit(EX_SOFTWARE);
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
  CantOpenFileFailure = "CANT_OPEN_FILE_FAILURE",
  MultibleClientsFailure = "MULTIBLE_CLIENTS_FAILURE",
  OpenFailure = "OPEN_FAILURE",
  FfmpegFailure = "FFMPEG_FAILURE",
}

export type Failure = { _isFailure: true; tag: InputFailureTag | SystemFailureTag; reason: string };

export function fail(tag: InputFailureTag | SystemFailureTag, reason: string): Failure {
  return { _isFailure: true, tag, reason };
}

export type Result<T> = T | Failure;

export function unwrap<T>(result: Result<T>): T {
  if (typeof result === "object" && result !== null && "_isFailure" in result) {
    const isInputFailure = Object.values(InputFailureTag).includes(result.tag as InputFailureTag);
    const isSystemFailure = Object.values(SystemFailureTag).includes(
      result.tag as SystemFailureTag,
    );

    console.error(`[${result.tag}] ${result.reason}`);

    if (isInputFailure) {
      Deno.exit(EX_DATAERR);
    } else if (isSystemFailure) {
      Deno.exit(EX_UNAVAILABLE);
    } else {
      throw Error("bruh wtf");
    }
  }

  return result as T;
}

export function failed<T>(result: Result<T>): boolean {
  return typeof result === "object" && result !== null && "_isFailure" in result;
}

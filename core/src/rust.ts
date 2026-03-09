import { fail, Result, SystemFailureTag } from "./err.ts";

const libName = (() => {
  switch (Deno.build.os) {
    case "windows":
      return "rust_core.dll";
    case "darwin":
      return "librust_core.dylib";
    case "linux":
      return "librust_core.so";
    default:
      throw new Error("Unsupported OS");
  }
})();

const libPath = new URL(
  `../../rust-core/target/release/${libName}`,
  import.meta.url,
).pathname;

const dylib = Deno.dlopen(libPath, {
  play_audio: { parameters: ["pointer"], result: "i32" },
});

// helper: create a null-terminated Uint8Array for the C string
function cstrBytes(s: string) {
  const enc = new TextEncoder();
  const bytes = enc.encode(s);
  const arr = new Uint8Array(bytes.length + 1);
  arr.set(bytes, 0);
  arr[bytes.length] = 0; // null terminator
  return arr;
}

export function playAudio(path: string): Result<undefined> {
  const buf = cstrBytes(path);
  const ptr = Deno.UnsafePointer.of(buf);
  const status = dylib.symbols.play_audio(ptr);

  if (status === 1) {
    return fail(SystemFailureTag.AudioPlaybackFailure, "Invalid audio path");
  } else if (status === 2) {
    return fail(
      SystemFailureTag.AudioPlaybackFailure,
      "Audio thread not available",
    );
  }

  return undefined;
}

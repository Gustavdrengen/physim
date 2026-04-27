import { join } from "@std/path";

export function getPlatformCacheDir(appName = "physim"): string {
  const os = Deno.build.os;
  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? ".";
  if (os === "windows") {
    const local = Deno.env.get("LOCALAPPDATA") ?? join(home, "AppData", "Local");
    return join(local, appName, "Cache");
  }
  if (os === "darwin") {
    return join(home, "Library", "Caches", appName);
  }
  // linux and other unix-like
  const xdg = Deno.env.get("XDG_CACHE_HOME") ?? join(home, ".cache");
  return join(xdg, appName);
}

export const CACHE_DIR = getPlatformCacheDir();

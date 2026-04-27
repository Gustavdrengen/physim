import esbuild from "esbuild";
import { dirname, fromFileUrl, join } from "@std/path";
import { ensureDir } from "@std/fs";
import { CACHE_DIR } from "../paths.ts";

const OUT_FILE = join(CACHE_DIR, "sim.js");

interface CacheManifest {
  hash: string;
  sources: Record<string, number>;
  timestamp: number;
}

interface SourceInfo {
  path: string;
  mtimeMs: number;
}

interface BuildOptions {
  profiling?: boolean;
  record?: boolean;
  noThrottle?: boolean;
  maxTime?: number;
}

function getSimDir(): string {
  return join(dirname(fromFileUrl(import.meta.url)), "..", "..", "sim");
}

function getManifestPath(): string {
  return join(CACHE_DIR, "sim_build_manifest.json");
}

async function getSourceFiles(): Promise<SourceInfo[]> {
  const simDir = getSimDir();
  const sources: SourceInfo[] = [];

  for await (const entry of Deno.readDir(simDir)) {
    if (
      entry.isFile &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))
    ) {
      const fullPath = join(simDir, entry.name);
      const stat = await Deno.stat(fullPath);
      sources.push({
        path: fullPath,
        mtimeMs: stat.mtime?.getSeconds() ?? 0,
      });
    }
  }

  return sources;
}

async function computeHash(
  sources: SourceInfo[],
  options: BuildOptions,
): Promise<string> {
  const data =
    sources.map((s) => `${s.path}:${s.mtimeMs}`).join("|") +
    "|" +
    JSON.stringify(options);
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function loadCacheManifest(): Promise<CacheManifest | null> {
  try {
    const data = await Deno.readTextFile(getManifestPath());
    return JSON.parse(data) as CacheManifest;
  } catch {
    return null;
  }
}

async function saveCacheManifest(manifest: CacheManifest): Promise<void> {
  await Deno.writeTextFile(
    getManifestPath(),
    JSON.stringify(manifest, null, 2),
  );
}

async function buildSimBundle(_options: BuildOptions): Promise<void> {
  const simDir = getSimDir();
  const mainPath = join(simDir, "main.ts");

  await esbuild.build({
    entryPoints: [mainPath],
    bundle: true,
    outfile: OUT_FILE,
    platform: "browser",
    format: "esm",
    sourcemap: true,
    minify: false,
    logLevel: "silent",
  });
}

export async function buildSimIfNeeded(
  options: BuildOptions = {},
): Promise<boolean> {
  await ensureDir(CACHE_DIR);
  const sources = await getSourceFiles();

  if (sources.length === 0) {
    return false;
  }

  const hash = await computeHash(sources, options);
  const cache = await loadCacheManifest();

  const sourceMap = Object.fromEntries(sources.map((s) => [s.path, s.mtimeMs]));

  if (cache && cache.hash === hash) {
    return false;
  }

  await buildSimBundle(options);

  const manifest: CacheManifest = {
    hash,
    sources: sourceMap,
    timestamp: Date.now(),
  };
  await saveCacheManifest(manifest);

  return true;
}

export async function cleanSimCache(): Promise<void> {
  try {
    await Deno.remove(OUT_FILE);
  } catch {
    //
  }
  try {
    await Deno.remove(OUT_FILE + ".map");
  } catch {
    //
  }
  try {
    await Deno.remove(getManifestPath());
  } catch {
    //
  }
}

if (import.meta.main) {
  const force = Deno.args.includes("--force");
  if (force) {
    await cleanSimCache();
  }

  const options: BuildOptions = {
    profiling: Deno.args.includes("--profiling"),
    record: Deno.args.includes("--record"),
    noThrottle: Deno.args.includes("--no-throttle"),
  };

  await buildSimIfNeeded(options);
}

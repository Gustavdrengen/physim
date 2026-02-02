import { ensureDir } from "@std/fs";
import * as print from "./print.ts";

interface CacheMetadata {
  url: string;
  timestamp: number;
  size: number;
}

function getPlatformCacheDir(appName = "physim"): string {
  const os = Deno.build.os;
  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? ".";
  if (os === "windows") {
    const local = Deno.env.get("LOCALAPPDATA") ?? `${home}\\AppData\\Local`;
    return `${local}\\${appName}\\Cache`;
  }
  if (os === "darwin") {
    return `${home}/Library/Caches/${appName}`;
  }
  // linux and other unix-like
  const xdg = Deno.env.get("XDG_CACHE_HOME") ?? `${home}/.cache`;
  return `${xdg}/${appName}`;
}

const PATH_SEP = Deno.build.os === "windows" ? "\\" : "/";
const CACHE_DIR = getPlatformCacheDir("physim");
const METADATA_FILE = `${CACHE_DIR}${PATH_SEP}metadata.json`;
const MAX_CACHE_SIZE = 200 * 1024 * 1024;

async function loadMetadata(): Promise<Map<string, CacheMetadata>> {
  try {
    const data = await Deno.readTextFile(METADATA_FILE);
    const entries = JSON.parse(data);
    return new Map(Object.entries(entries));
  } catch {
    return new Map();
  }
}

async function saveMetadata(
  metadata: Map<string, CacheMetadata>,
): Promise<void> {
  await ensureDir(CACHE_DIR);
  const obj = Object.fromEntries(metadata);
  await Deno.writeTextFile(METADATA_FILE, JSON.stringify(obj, null, 2));
}

function getCacheKey(url: string): string {
  return btoa(url).replace(/[/+=]/g, "_");
}

function getCachePath(key: string): string {
  return `${CACHE_DIR}/${key}.cache`;
}

async function evictOldest(
  metadata: Map<string, CacheMetadata>,
): Promise<void> {
  const totalSize = Array.from(metadata.values()).reduce(
    (sum, m) => sum + m.size,
    0,
  );

  if (totalSize <= MAX_CACHE_SIZE) {
    return;
  }

  const sorted = Array.from(metadata.entries()).sort(
    (a, b) => a[1].timestamp - b[1].timestamp,
  );

  let currentSize = totalSize;
  for (const [key, meta] of sorted) {
    if (currentSize <= MAX_CACHE_SIZE) {
      break;
    }

    try {
      await Deno.remove(getCachePath(key));
      metadata.delete(key);
      currentSize -= meta.size;
    } catch {
      metadata.delete(key);
    }
  }

  await saveMetadata(metadata);
}

export async function fetchWithCache(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  print.info(`Fetching: ${url}`);
  await ensureDir(CACHE_DIR);
  const metadata = await loadMetadata();
  const key = getCacheKey(url);
  const cachePath = getCachePath(key);

  const cached = metadata.get(key);
  if (cached) {
    try {
      const data = await Deno.readFile(cachePath);
      const decoded = new TextDecoder().decode(data);
      const parsed = JSON.parse(decoded);

      print.info(`Served from cache: ${url}`);
      return new Response(parsed.body, {
        status: parsed.status,
        statusText: parsed.statusText,
        headers: new Headers(parsed.headers),
      });
    } catch {
      metadata.delete(key);
    }
  }

  const response = await globalThis.fetch(url, options);

  if (response.ok) {
    const body = await response.text();
    const headers = Object.fromEntries(response.headers.entries());

    const cacheData = {
      body,
      status: response.status,
      statusText: response.statusText,
      headers,
    };

    const serialized = JSON.stringify(cacheData);
    const size = new TextEncoder().encode(serialized).length;

    await Deno.writeTextFile(cachePath, serialized);

    metadata.set(key, {
      url,
      timestamp: Date.now(),
      size,
    });

    await saveMetadata(metadata);
    await evictOldest(metadata);

    print.info(`Fetched and cached: ${url}`);
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  return response;
}

export async function printCacheStats(): Promise<void> {
  const metadata = await loadMetadata();
  const entries = Array.from(metadata.values());

  const totalSize = entries.reduce((sum, m) => sum + m.size, 0);
  const count = entries.length;

  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  const maxMB = (MAX_CACHE_SIZE / (1024 * 1024)).toFixed(0);

  print.raw(`Cache Stats:`);
  print.raw(`  Entries: ${count}`);
  print.raw(`  Total Size: ${sizeMB} MB / ${maxMB} MB`);
  print.raw(`  Cache Directory: ${CACHE_DIR}`);

  if (entries.length > 0) {
    const oldest = entries.reduce((min, m) =>
      m.timestamp < min.timestamp ? m : min,
    );
    const newest = entries.reduce((max, m) =>
      m.timestamp > max.timestamp ? m : max,
    );

    print.raw(`  Oldest Entry: ${new Date(oldest.timestamp).toISOString()}`);
    print.raw(`  Newest Entry: ${new Date(newest.timestamp).toISOString()}`);
  }
}

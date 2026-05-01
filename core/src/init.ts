import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

const scriptDir = dirname(new URL(import.meta.url).pathname);
const stdlibAbs = join(scriptDir, "../../std");
const sandboxAbs = join(scriptDir, "../../sandbox.d.ts");

/**
 * Recursively copy a directory.
 */
function copyDir(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyDirFile(srcPath, destPath);
    }
  }
}

/**
 * Copy a single file, creating parent directories if needed.
 */
function copyDirFile(src: string, dest: string): void {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

/**
 * Get the most recent modification time of any file in a directory tree.
 */
function getDirMtime(dir: string): number {
  let latest = 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      latest = Math.max(latest, getDirMtime(fullPath));
    } else {
      latest = Math.max(latest, statSync(fullPath).mtimeMs);
    }
  }
  return latest;
}

/**
 * Check if the stdlib needs to be updated based on timestamp.
 * TODO: Replace with version check once versioning is implemented.
 */
function needsUpdate(nodeModulesPhysim: string): boolean {
  const timestampPath = join(nodeModulesPhysim, ".timestamp");
  if (!existsSync(nodeModulesPhysim) || !existsSync(timestampPath)) {
    return true;
  }
  const storedMtime = parseInt(readFileSync(timestampPath, "utf-8").trim(), 10);
  const currentMtime = getDirMtime(stdlibAbs);
  return currentMtime > storedMtime;
}

/**
 * Perform the initial setup: copy sandbox.d.ts and stdlib to node_modules.
 */
async function setupNodeModules(): Promise<void> {
  // Validate source files exist
  if (!existsSync(stdlibAbs)) {
    throw new Error(`std directory not found at ${stdlibAbs}. Is physim installed correctly?`);
  }
  if (!existsSync(sandboxAbs)) {
    throw new Error(`sandbox.d.ts not found at ${sandboxAbs}. Is physim installed correctly?`);
  }

  const nodeModulesPhysim = join(Deno.cwd(), "node_modules/physim");

  if (existsSync(nodeModulesPhysim)) {
    if (!needsUpdate(nodeModulesPhysim)) {
      return; // Already up to date
    }
    // Clean up for fresh copy
    await Deno.remove(nodeModulesPhysim, { recursive: true });
  }

  // Get mtime early (used after copy completes)
  const currentMtime = getDirMtime(stdlibAbs);
  const timestampPath = join(nodeModulesPhysim, ".timestamp");

  // Copy sandbox.d.ts
  const destSandbox = join(nodeModulesPhysim, "sandbox.d.ts");
  copyDirFile(sandboxAbs, destSandbox);

  // Copy stdlib
  const destStd = join(nodeModulesPhysim, "std");
  copyDir(stdlibAbs, destStd);

  // Write timestamp after successful copy
  writeFileSync(timestampPath, currentMtime.toString(), "utf-8");
}

/**
 * Generate the tsconfig.json with relative paths to node_modules.
 */
async function generateTsconfig(): Promise<void> {
  const tsconfig = {
    compilerOptions: {
      target: "ES2020",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      lib: ["esnext", "dom"],
      types: ["node_modules/physim/sandbox.d.ts"],
      allowImportingTsExtensions: true,
      paths: {
        "physim/*": ["node_modules/physim/std/src/public/*"],
      },
    },
  };

  const outputPath = join(Deno.cwd(), "tsconfig.json");
  await Deno.writeTextFile(outputPath, JSON.stringify(tsconfig, null, 2));
}

export async function init() {
  await setupNodeModules();
  await generateTsconfig();
}

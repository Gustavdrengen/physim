import esbuild from "esbuild";
import { dirname, fromFileUrl, join } from "@std/path";
import { typeCheck } from "./tsc.ts";
const scriptDir = dirname(fromFileUrl(import.meta.url));
const stdlibPath = join(scriptDir, "..", "std", "mod.ts");

const aliasPlugin = {
  name: "physim-alias-simple",
  setup(build: any) {
    build.onResolve({ filter: /^physim$/ }, () => {
      return { path: stdlibPath };
    });
  },
};

export async function buildSimulation(entrypoint: string, outfile: string) {
  const check = await typeCheck(entrypoint);
  if (!check.success) {
    console.error("Type checking failed:");
    console.error(check.stdout);
    Deno.exit(1);
  }

  await esbuild.build({
    entryPoints: [entrypoint],
    bundle: true,
    outfile,
    platform: "browser",
    format: "esm",
    minify: false,
    sourcemap: true,
    plugins: [aliasPlugin],
  });
}

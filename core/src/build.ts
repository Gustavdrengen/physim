import esbuild from "esbuild";
import { dirname, fromFileUrl, join } from "@std/path";
import { typeCheck } from "./tsc.ts";
import { fail, InputFailureTag, Result } from "./err.ts";
const scriptDir = dirname(fromFileUrl(import.meta.url));
const stdlibPath = join(scriptDir, "..", "..", "std", "src", "mod.ts");

const aliasPlugin = {
  name: "physim-alias",
  setup(build: any) {
    build.onResolve({ filter: /^physim$/ }, () => {
      return { path: stdlibPath };
    });
  },
};

export async function buildSimulation(
  entrypoint: string,
  outfile: string,
): Promise<Result<undefined>> {
  const check = await typeCheck(entrypoint);
  if (!check.success) {
    return fail(InputFailureTag.TypeCheckFailure, check.stdout);
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

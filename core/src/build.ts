import esbuild from "esbuild";
import { dirname, fromFileUrl, join } from "@std/path";
import { typeCheck } from "./tsc.ts";
import { fail, InputFailureTag, Result } from "./err.ts";
const scriptDir = dirname(fromFileUrl(import.meta.url));

const aliasPlugin = {
  name: "physim-alias",
  setup(build: any) {
    build.onResolve({ filter: /^physim(\/.*)?$/ }, (args: any) => {
      // physim/<subpath> -> src/public/<subpath>.ts
      const subpath = args.path.replace(/^physim\//, ""); // e.g. "x" or "foo/bar"
      const target = join(scriptDir, "..", "..", "std", "src", "public", `${subpath}.ts`);

      return { path: target };
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
    sourcemap: true,
    treeShaking: true,
    minify: false,
    plugins: [aliasPlugin],
  });
}

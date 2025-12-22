import { fromFileUrl, join, resolve } from "@std/path";

const envDeclarationRelative = "../../../sandbox.d.ts";
const stdlibPathRelative = "../../../std";
const outputTsconfig = "./tsconfig.json";

const scriptDir = fromFileUrl(import.meta.url);
const envDeclarationAbs = resolve(scriptDir, envDeclarationRelative);
const stdlibAbs = resolve(scriptDir, stdlibPathRelative);

const tsconfig = {
  compilerOptions: {
    target: "ES2020",
    module: "ESNext",
    moduleResolution: "bundler",
    strict: true,
    lib: ["esnext", "dom"],

    types: [envDeclarationAbs],

    allowImportingTsExtensions: true,

    baseUrl: "/",
    paths: {
      "physim/*": [join(stdlibAbs, "src/public/*")],
    },
  },
};

export async function init() {
  await Deno.writeTextFile(
    outputTsconfig,
    JSON.stringify(tsconfig, null, 2),
  );
}

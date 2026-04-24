import { dirname, join, resolve } from "@std/path";
import { fail, InputFailureTag, Result } from "../err.ts";

const decoder = new TextDecoder();

async function run(cmd: string, args: string[] = [], cwd?: string) {
  const command = new Deno.Command(cmd, {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  });

  const { success, code, stdout, stderr } = await command.output();
  return {
    success,
    code,
    stdout: decoder.decode(stdout),
    stderr: decoder.decode(stderr),
  };
}

export async function typeCheck(
  entrypoint: string,
): Promise<Result<{ stdout: string; stderr: string }>> {
  const resolved = resolve(Deno.cwd(), entrypoint);
  const entryDir = dirname(resolved);

  try {
    const tsconfigPath = join(entryDir, "tsconfig.json");
    await Deno.stat(tsconfigPath);
  } catch {
    return fail(
      InputFailureTag.TsConfigMissingFailure,
      `No tsconfig.json found in ${entryDir}. A tsconfig.json is required for type checking.`,
    );
  }

  const result = await run("tsc", ["--noEmit"], entryDir);

  if (!result.success) {
    return fail(InputFailureTag.TypeCheckFailure, result.stdout || result.stderr);
  }

  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

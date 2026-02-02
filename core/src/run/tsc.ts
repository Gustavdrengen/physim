import { dirname, resolve } from "@std/path";

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
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  const resolved = resolve(Deno.cwd(), entrypoint);
  const entryDir = dirname(resolved);

  const result = await run("tsc", ["--noEmit"], entryDir);

  return {
    success: result.success,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

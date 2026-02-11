import { fail, Result, SystemFailureTag } from "./err.ts";

export async function openUrl(url: string): Promise<Result<undefined>> {
  new URL(url);

  const os = Deno.build.os;
  let program: string;
  let args: string[];

  if (os === "windows") {
    program = "cmd.exe";
    args = ["/c", "start", "", url];
  } else if (os === "darwin") {
    program = "open";
    args = [url];
  } else {
    let isWsl = false;
    try {
      if (Deno.env.get("WSL_DISTRO_NAME")) isWsl = true;
      else {
        const ver = await Deno.readTextFile("/proc/version");
        if (/microsoft/i.test(ver)) isWsl = true;
      }
    } catch {
      //
    }

    if (isWsl) {
      program = "cmd.exe";
      args = ["/c", "start", "", url];
    } else {
      program = "xdg-open";
      args = [url];
    }
  }

  try {
    const proc = new Deno.Command(program, { args });
    const { success, code, stderr } = await proc.output();

    if (success) return;

    const stderrText = new TextDecoder().decode(stderr).trim();
    const msg = `Command exited with code ${code}${stderrText ? `: ${stderrText}` : ""}`;
    return fail(SystemFailureTag.OpenFailure, msg);
  } catch (err) {
    return fail(
      SystemFailureTag.OpenFailure,
      `Failed to launch browser command (${program} ${args.join(" ")}): ${String(err)}`,
    );
  }
}

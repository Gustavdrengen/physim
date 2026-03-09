export function openWebview(url: string): Deno.ChildProcess {
  const subprocessUrl = new URL("./webview_subprocess.ts", import.meta.url).href;
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-all",
      subprocessUrl,
      url,
    ],
    stdout: "null",
    stderr: "null",
  });
  return command.spawn();
}

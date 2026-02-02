export async function playMP3(fileName: string) {
  const players: [string, ...string[]][] = [
    ["mpv", "--no-terminal", "--quiet", fileName],
    ["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet", fileName],
    ["afplay", fileName],
    ["powershell", "-c", `Start-Process -FilePath "${fileName}"`],
  ];

  let playerFound = false;

  for (const cmd of players) {
    try {
      const p = new Deno.Command(cmd[0], {
        args: cmd.slice(1),
        stdout: "null",
        stderr: "null",
      }).spawn();

      playerFound = true;
      await p.status;
      break;
    } catch {
      // player not available, try next
    }
  }

  if (!playerFound) {
    throw new Error(
      "No suitable audio player found. Install mpv, ffplay, or use macOS afplay.",
    );
  }
}

import { fail, Result, SystemFailureTag } from "./err.ts";
import { NoteEvent } from "../../sound.ts";

export async function playMP3(fileName: string) {
  const players = [
    ["mpv", "--no-terminal", "--quiet", fileName], // cross-platform
    ["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet", fileName],
    ["afplay", fileName], // macOS
    ["powershell", "-c", `Start-Process -FilePath "${fileName}"`], // Windows fallback
  ];

  let playerFound = false;

  for (const cmd of players) {
    try {
      const p = new Deno.Command(cmd[0], { args: cmd.slice(1) }).spawn();
      playerFound = true;
      await p.status;
      break;
    } catch (_err) {
      // player not available, try next
    }
  }

  if (!playerFound) {
    throw new Error(
      "No suitable audio player found. Install mpv, ffplay, or use macOS afplay.",
    );
  }
}

export async function addAudioToMp4(
  clips: [number, string][],
  mp4Path: string,
  framerate: number,
): Promise<Result<undefined>> {
  const validClips: { frame: number; path: string }[] = [];
  for (const item of clips) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const frame = Number(item[0]);
    const path = String(item[1]);
    if (!Number.isFinite(frame) || frame < 0) continue;
    try {
      await Deno.stat(path);
    } catch {
      return fail(
        SystemFailureTag.FfmpegFailure,
        `Clip file not found: ${path}`,
      );
    }
    validClips.push({ frame, path });
  }

  if (validClips.length === 0) {
    return fail(SystemFailureTag.FfmpegFailure, "No valid clips provided");
  }

  try {
    await Deno.stat(mp4Path);
  } catch {
    return fail(
      SystemFailureTag.FfmpegFailure,
      `MP4 file not found: ${mp4Path}`,
    );
  }

  async function mp4HasAudio(path: string): Promise<boolean> {
    const probe = new Deno.Command("ffprobe", {
      args: [
        "-v",
        "error",
        "-select_streams",
        "a",
        "-show_entries",
        "stream=index",
        "-of",
        "csv=p=0",
        path,
      ],
      stdout: "piped",
      stderr: "null",
    });
    const { code, stdout } = await probe.output();
    if (code !== 0) {
      return false;
    }
    const txt = new TextDecoder().decode(stdout).trim();
    return txt.length > 0;
  }

  const hasAudio = await mp4HasAudio(mp4Path);

  const args: string[] = ["-y", "-i", mp4Path];
  for (const clip of validClips) args.push("-i", clip.path);

  const filterParts: string[] = [];
  const delayedLabels: string[] = [];
  for (let i = 0; i < validClips.length; i++) {
    const { frame } = validClips[i];
    const startMs = Math.round((frame / framerate) * 1000);
    const inputIndex = i + 1;
    const label = `a${i}`;
    filterParts.push(`[${inputIndex}:a]adelay=${startMs}:all=1[${label}]`);
    delayedLabels.push(`[${label}]`);
  }

  const audioSources: string[] = [];
  if (hasAudio) audioSources.push("[0:a]");
  audioSources.push(...delayedLabels);

  let finalAudioLabel = "";
  if (audioSources.length === 1) {
    finalAudioLabel = audioSources[0];
  } else {
    const inputsCount = audioSources.length;
    filterParts.push(
      `${audioSources.join("")}amix=inputs=${inputsCount}:duration=longest[aout]`,
    );
    finalAudioLabel = "[aout]";
  }

  const filterComplex = filterParts.join(";");

  const tmpOutput = `${mp4Path}.with_added_audio.tmp.mp4`;

  args.push("-filter_complex", filterComplex);
  args.push("-map", "0:v");
  args.push("-map", finalAudioLabel);
  args.push("-c:v", "copy", "-c:a", "aac", "-b:a", "192k", tmpOutput);

  try {
    const ff = new Deno.Command("ffmpeg", {
      args,
    });

    const { code } = await ff.output();
    if (code !== 0) {
      try {
        await Deno.remove(tmpOutput);
      } catch {
        //
      }
      return fail(
        SystemFailureTag.FfmpegFailure,
        `ffmpeg exited with code ${code}`,
      );
    }

    const backupPath = `${mp4Path}.bak.${Date.now()}`;
    try {
      await Deno.rename(mp4Path, backupPath);
      await Deno.rename(tmpOutput, mp4Path);
      await Deno.remove(backupPath);
    } catch (err) {
      try {
        const statBackup = await Deno.stat(backupPath).catch(() => null);
        if (statBackup) {
          try {
            await Deno.remove(tmpOutput).catch(() => {});
          } catch {
            //
          }
          await Deno.rename(backupPath, mp4Path);
        }
      } catch {
        //
      }
      return fail(
        SystemFailureTag.FfmpegFailure,
        `Failed to replace MP4: ${String(err)}`,
      );
    }
  } catch (err) {
    return fail(
      SystemFailureTag.FfmpegFailure,
      `Unexpected error: ${String(err)}`,
    );
  }

  return undefined as unknown as Result<undefined>;
}

// Helper function to encode a number as a variable-length quantity (VLQ)
function encodeVlq(value: number): number[] {
  if (value === 0) {
    return [0];
  }
  const bytes: number[] = [];
  let buffer = value;
  while (buffer > 0) {
    let byte = buffer & 0x7f;
    buffer >>= 7;
    if (bytes.length > 0) {
      byte |= 0x80;
    }
    bytes.push(byte);
  }
  return bytes.reverse();
}

// Function to create a MIDI file from NoteEvents
function createMidiFile(notes: NoteEvent[], ticksPerQuarterNote = 128): Uint8Array {
  // MIDI events: [time in ticks, type, note, velocity]
  const midiEvents: [number, number, number, number][] = [];
  const tempo = 120; // bpm
  const ticksPerSecond = ticksPerQuarterNote * (tempo / 60);

  for (const note of notes) {
    const startTimeTicks = Math.round(note.time * ticksPerSecond);
    const durationTicks = Math.round(note.duration * ticksPerSecond);
    const endTimeTicks = startTimeTicks + durationTicks;
    const velocity = Math.round(note.velocity);
    const channel = note.channel;

    // Note On event: 0x90 | channel
    midiEvents.push([startTimeTicks, 0x90 | channel, note.note, velocity]);
    // Note Off event: 0x80 | channel
    midiEvents.push([endTimeTicks, 0x80 | channel, note.note, 0]); // Velocity 0 for Note Off
  }

  // Sort events by time
  midiEvents.sort((a, b) => a[0] - b[0]);

  const trackData: number[] = [];
  let lastTick = 0;

  // Add a tempo event at the beginning
  const microsecondsPerQuarterNote = 60000000 / tempo;
  const tempoBytes = [
    0x00, // delta-time
    0xFF, // meta-event
    0x51, // set tempo
    0x03, // length
    (microsecondsPerQuarterNote >> 16) & 0xff,
    (microsecondsPerQuarterNote >> 8) & 0xff,
    microsecondsPerQuarterNote & 0xff,
  ];
  trackData.push(...tempoBytes);


  for (const event of midiEvents) {
    const [tick, type, note, velocity] = event;
    const deltaTicks = tick - lastTick;
    lastTick = tick;

    const deltaTimeBytes = encodeVlq(deltaTicks);
    trackData.push(...deltaTimeBytes);
    trackData.push(type, note, velocity);
  }

  // End of track event
  trackData.push(0x01, 0xFF, 0x2F, 0x00);

  const trackLength = trackData.length;
  // MTrk chunk
  const trackChunk = [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    (trackLength >> 24) & 0xff,
    (trackLength >> 16) & 0xff,
    (trackLength >> 8) & 0xff,
    trackLength & 0xff,
    ...trackData,
  ];

  // MThd chunk
  const headerChunk = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // header length
    0x00, 0x00, // format 0 (single track)
    0x00, 0x01, // number of tracks
    (ticksPerQuarterNote >> 8) & 0xff,
    ticksPerQuarterNote & 0xff,
  ];

  return new Uint8Array([...headerChunk, ...trackChunk]);
}

export async function synthMidi(
  midi: string | NoteEvent[],
  soundfont: string,
  outputFile: string,
): Promise<Result<undefined>> {
  let midiPath = "";
  let tempMidiPath: string | undefined = undefined;

  if (typeof midi === "string") {
    midiPath = midi;
  } else {
    try {
      tempMidiPath = await Deno.makeTempFile({ suffix: ".mid" });
      const midiData = createMidiFile(midi);
      await Deno.writeFile(tempMidiPath, midiData);
      midiPath = tempMidiPath;
    } catch (err) {
      if (tempMidiPath) {
        try {
          await Deno.remove(tempMidiPath);
        } catch {
          // ignore
        }
      }
      return fail(
        SystemFailureTag.MidiSynthesisFailure,
        `Failed to create temporary MIDI file: ${err.message}`,
      );
    }
  }

  try {
    const command = new Deno.Command("fluidsynth", {
      args: ["-ni", soundfont, midiPath, "-F", outputFile, "-q"],
    });
    const { code, stderr } = await command.output();

    if (code !== 0) {
      const error = new TextDecoder().decode(stderr);
      return fail(
        SystemFailureTag.MidiSynthesisFailure,
        `fluidsynth exited with code ${code}: ${error}`,
      );
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return fail(
        SystemFailureTag.MidiSynthesisFailure,
        "fluidsynth is not installed. Please install it to synthesize MIDI.",
      );
    }
    return fail(
      SystemFailureTag.MidiSynthesisFailure,
      `Failed to run fluidsynth: ${err.message}`,
    );
  } finally {
    if (tempMidiPath) {
      try {
        await Deno.remove(tempMidiPath);
      } catch {
        // ignore
      }
    }
  }

  return undefined as unknown as Result<undefined>;
}
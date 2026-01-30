export type Channel = number; // 0..15

export interface NoteEvent {
  time: number; // seconds (absolute/relative)
  note: number; // MIDI 0..127
  velocity: number; // 0..127
  duration: number; // seconds
  channel: Channel; // 0..15
}

export interface midiSource {
  /// Path to MIDI file or inline note events
  midi: string | NoteEvent[];
  /// Soundfont path
  soundfont: string;
}

export interface SoundProps {
  src: string | midiSource;

  /**
   * Effects / post-processing
   * Keys map directly to FFmpeg CLI options
   *
   * Example mapping rules:
   * - "volume" => -filter:a "volume=<value>"
   * - "atempo" => -filter:a "atempo=<value>"
   * - "rawArgs" (string[]) appended verbatim
   */
  effects?: Record<string, string | number | boolean>;
}

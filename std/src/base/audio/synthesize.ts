import { NOTE_MAP } from "./notes";

/**
 * Types of waveforms.
 */
export type WaveformType =
    | "sine"
    | "square"
    | "triangle"
    | "sawtooth"
    | "trapezium"
    | "exp"
    | "noise"
    | "pinknoise"
    | "brownnoise"
    | "whitenoise";

/**
 * An oscillator for synthesis.
 */
export interface Oscillator {
    /**
     * The type of oscillator.
     */
    type: WaveformType;
    /**
     * The frequency of the oscillator in Hz or as a note (e.g. "A4").
     * Can be a single value or an array of two values for a frequency sweep.
     */
    freq?: number | string | [number | string, number | string];
    /**
     * The phase of the oscillator in percentage (0-100).
     */
    phase?: number;
    /**
     * Extra parameters for some waveforms (e.g. trapezium).
     */
    p1?: number;
    p2?: number;
    p3?: number;
}

/**
 * A combination of oscillators for synthesis.
 */
export type SynthCombine = "mix" | "amod" | "fmod" | "sum" | "product";

/**
 * A human readable form of structuring a synthesis.
 * 
 * @example
 * ```ts
 * import { Synth } from "physim/base";
 * 
 * const beep: Synth = {
 *   duration: 0.1,
 *   oscillators: { type: "sine", freq: 440 }
 * };
 * ```
 */
export interface Synth {
    /**
     * The duration of the synthesis in seconds.
     */
    duration: number;
    /**
     * The oscillators to use for the synthesis.
     */
    oscillators: Oscillator | Oscillator[];
    /**
     * The way to combine the oscillators.
     * @default "mix"
     */
    combine?: SynthCombine;
}

function noteNameToFreq(note: string): number {
    const match = note.match(/^([A-G](?:#|b)?)(-?\d+)$/);

    if (!match) {
        throw new Error(`Invalid note format: ${note}`);
    }

    const [, pitch, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);

    const noteIndex = NOTE_MAP[pitch];
    if (noteIndex === undefined) {
        throw new Error(`Unknown pitch: ${pitch}`);
    }

    const midi = (octave + 1) * 12 + noteIndex;
    return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Converts a Synth object to raw SoX arguments.
 * @internal
 */
export function synthToSoxArgs(synth: Synth): string[] {
    const args: string[] = ["synth", synth.duration.toString()];

    const oscillators = Array.isArray(synth.oscillators)
        ? synth.oscillators
        : [synth.oscillators];

    for (let i = 0; i < oscillators.length; i++) {
        const osc = oscillators[i]!;

        // Add type
        args.push(osc.type);

        // For subsequent oscillators, add the combine method if provided
        if (i > 0 && synth.combine) {
            args.push(synth.combine);
        }

        // Add frequency (or sweep)
        if (osc.freq !== undefined) {
            if (Array.isArray(osc.freq)) {
                const f1 =
                    typeof osc.freq[0] === "string"
                        ? noteNameToFreq(osc.freq[0])
                        : osc.freq[0];
                const f2 =
                    typeof osc.freq[1] === "string"
                        ? noteNameToFreq(osc.freq[1])
                        : osc.freq[1];
                args.push(f1 + "-" + f2);
            } else {
                const freq =
                    typeof osc.freq === "string" ? noteNameToFreq(osc.freq) : osc.freq;
                args.push(freq.toString());
            }
        }

        // Handle phase and extra parameters (p1, p2, p3)
        // SoX positional parameters for synth: [type [combine] [freq [off [phst [p1 [p2 [p3]]]]]]]
        if (
            osc.phase !== undefined ||
            osc.p1 !== undefined ||
            osc.p2 !== undefined ||
            osc.p3 !== undefined
        ) {
            // If freq was omitted but we have phase/p1.., we must provide a frequency (default 0 or -)
            if (osc.freq === undefined) {
                args.push("0");
            }

            // Offset (off) - default 0
            args.push("0");

            // Phase (phst)
            args.push(osc.phase !== undefined ? osc.phase.toString() : "0");

            // Waveform specific parameters (p1, p2, p3)
            if (
                osc.p1 !== undefined ||
                osc.p2 !== undefined ||
                osc.p3 !== undefined
            ) {
                args.push(osc.p1 !== undefined ? osc.p1.toString() : "0");
                if (osc.p2 !== undefined || osc.p3 !== undefined) {
                    args.push(osc.p2 !== undefined ? osc.p2.toString() : "0");
                    if (osc.p3 !== undefined) {
                        args.push(osc.p3.toString());
                    }
                }
            }
        }
    }

    return args;
}

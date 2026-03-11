/**
 * Utility functions for building complex synthesizers.
 * This module is internal and not exported to the public API.
 * @internal
 */

import { Oscillator, Synth, WaveformType } from "../../base/audio/synthesize";

/**
 * A standard impact pattern: a frequency-swept tone mixed with noise.
 */
export function impact(
  duration: number,
  freqRange: [number, number],
  noiseType: WaveformType = "brownnoise"
): Synth {
  return {
    duration,
    oscillators: [
      { type: "sine", freq: freqRange },
      { type: noiseType }
    ],
    combine: "mix"
  };
}

/**
 * Creates a rich sound by stacking multiple sine waves at harmonic intervals.
 */
export function harmonicStack(
  duration: number,
  fundamental: number,
  harmonics: number = 4
): Synth {
  const oscillators: Oscillator[] = [];
  for (let i = 1; i <= harmonics; i++) {
    oscillators.push({
      type: "sine",
      freq: fundamental * i,
      // Lower volume for higher harmonics (simulated by not having volume, 
      // but we can use phase or other params if SoX supported them better)
    });
  }
  return {
    duration,
    oscillators,
    combine: "mix"
  };
}

/**
 * Sets up a modulated sound where a carrier waveform is modified by a modulator.
 */
export function modulated(
  duration: number,
  carrierType: WaveformType,
  carrierFreq: number | [number, number],
  modulatorType: WaveformType,
  modulatorFreq: number
): Synth {
  return {
    duration,
    oscillators: [
      { type: carrierType, freq: carrierFreq },
      { type: modulatorType, freq: modulatorFreq }
    ],
    combine: "amod"
  };
}

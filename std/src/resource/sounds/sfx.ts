import { Synth } from "../../base/audio/synthesize";
import * as synth from "./synth.ts";

/**
 * A collection of procedural sound effect generators.
 */
export namespace SFX {
  /**
   * Generates a sound for a physical collision.
   *
   * @param intensity - The intensity of the collision (0 to 1).
   * @param hardness - The hardness of the colliding objects (0 to 1).
   * @param duration - Optional duration override in seconds.
   * @returns A Synth configuration.
   */
  export function collision(
    intensity: number,
    hardness: number,
    duration?: number,
  ): Synth {
    const d = duration ?? 0.05 + 0.1 * intensity;
    const startFreq = 200 + 1000 * hardness * intensity;
    const endFreq = 100 + 200 * hardness;
    return synth.impact(d, [startFreq, endFreq]);
  }

  /**
   * Generates a sound for an explosion or high-energy release.
   *
   * @param intensity - The intensity of the explosion (0 to 1).
   * @param duration - Optional duration override in seconds.
   * @returns A Synth configuration.
   */
  export function explosion(intensity: number, duration?: number): Synth {
    return {
      duration: duration ?? 0.5 + 1.5 * intensity,
      oscillators: [{ type: "brownnoise" }, { type: "pinknoise" }],
      combine: "mix",
    };
  }

  /**
   * Generates a sound representing structural stress or tension.
   *
   * @param tension - The amount of tension (0 to 1).
   * @param duration - Optional duration override in seconds.
   * @returns A Synth configuration.
   */
  export function stress(tension: number, duration?: number): Synth {
    const d = duration ?? 0.2 + 0.8 * tension;
    const baseFreq = 200 + 600 * tension;

    return {
      duration: d,
      oscillators: [
        // A triangle wave for a metallic, resonant character.
        { type: "triangle", freq: [baseFreq, baseFreq * (1 + 0.05 * tension)] },
        // A dissonant sine wave to create an unstable "beating" or ring-modulated sound.
        {
          type: "sine",
          freq: [baseFreq * 1.618, baseFreq * 1.618 * (1 + 0.1 * tension)],
        },
        // A low-frequency oscillator to create "pulsing" or "creaking" transients.
        { type: "sine", freq: [6 + 18 * tension, 12 + 36 * tension] },
      ],
      combine: "amod",
    };
  }

  /**
   * Generates a sound for phase changes or rapid state transitions.
   *
   * @param rate - The rate of change or transition intensity (0 to 1).
   * @param duration - Optional duration override in seconds.
   * @returns A Synth configuration.
   */
  export function phaseChange(rate: number, duration?: number): Synth {
    const dur = duration ?? 0.05 + 0.15 * rate;
    const start = 4000;
    const end = 4000 + 2000 * rate;
    const detune = 1 + 0.02 * rate;
    return {
      duration: dur,
      oscillators: [
        { type: "sine", freq: [start, end] },
        {
          type: "sine",
          freq: [start * detune, end * detune],
          phase: 100 * rate,
        },
        { type: "whitenoise" },
      ],
    };
  }

  /**
   * Generates a sound mapping a physical oscillation to an audible tone.
   *
   * @param frequency - The physical frequency of the oscillation in Hz.
   * @param amplitude - The amplitude of the oscillation (0 to 1).
   * @param duration - The duration of the sound in seconds.
   * @returns A Synth configuration.
   */
  export function oscillation(
    frequency: number,
    amplitude: number,
    duration: number = 0.1,
  ): Synth {
    return {
      duration: duration,
      oscillators: [{ type: "sine", freq: frequency * 100 }],
    };
  }

  /**
   * Generates a ringing sound representing the resonance of an object being struck.
   *
   * @param fundamental - The fundamental frequency of resonance in Hz.
   * @param dampening - The amount of dampening (0 = long ring, 1 = short ring).
   * @param duration - Optional duration override in seconds.
   * @returns A Synth configuration.
   */
  export function resonance(
    fundamental: number,
    dampening: number,
    duration?: number,
  ): Synth {
    const d = duration ?? 0.1 + 1.0 * (1 - dampening);
    return synth.harmonicStack(d, fundamental, 5);
  }

  /**
   * Generates a sound for physical friction between two surfaces.
   *
   * @param velocity - The relative velocity between surfaces (0 to 1).
   * @param roughness - The roughness of the surfaces (0 to 1).
   * @param duration - The duration of the friction sound in seconds.
   * @returns A Synth configuration.
   */
  export function friction(
    velocity: number,
    roughness: number,
    duration: number = 0.1,
  ): Synth {
    return synth.modulated(
      duration,
      "brownnoise",
      0,
      "sine",
      10 + 100 * velocity * roughness,
    );
  }

  /**
   * Generates a sound for an electric discharge or plasma-like event.
   *
   * @param intensity - The intensity of the discharge (0 to 1).
   * @param duration - Optional duration override in seconds.
   * @returns A Synth configuration.
   */
  export function electricDischarge(
    intensity: number,
    duration?: number,
  ): Synth {
    const d = duration ?? 0.05 + 0.1 * intensity;
    return synth.modulated(d, "whitenoise", 0, "square", 50 + 200 * intensity);
  }

  /**
   * Generates a sound representing a vortex or cyclonic flow.
   *
   * @param strength - The strength/speed of the vortex (0 to 1).
   * @param radius - The radius of the vortex (0 to 1).
   * @param duration - The duration of the vortex sound in seconds.
   * @returns A Synth configuration.
   */
  export function vortex(
    strength: number,
    radius: number,
    duration: number = 0.2,
  ): Synth {
    return synth.modulated(
      duration,
      "brownnoise",
      0,
      "sine",
      1 + (10 * strength) / (radius + 0.1),
    );
  }
}

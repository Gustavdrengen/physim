/**
 * This module provides a library of sound effects and instruments.
 *
 * @example
 * ```ts
 * import { Sound } from "physim/base";
 * import { SFX, Instruments } from "physim/sounds";
 *
 * // Create and play a collision sound effect
 * const collisionSynth = SFX.collision(0.8, 0.5);
 * const collisionSound = await Sound.fromSynth(collisionSynth);
 * collisionSound.play();
 *
 * // Create a sound from a musical note using an instrument
 * const pianoSound = await Sound.fromNote("C4", Instruments.PIANO);
 * pianoSound.play();
 * ```
 *
 * @module
 */
export * from "../resource/sounds/sfx.ts";
export * from "../resource/sounds/instruments.ts";

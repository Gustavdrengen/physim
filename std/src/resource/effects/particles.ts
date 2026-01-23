/**
 * @module
 * This module provides a library of pre-configured particle effects.
 */

import { Vec2 } from "../../base/vec";
import { Color } from "../../base/draw/color";
import { ParticleEmissionOptions } from "../../base/particles/particle";
import { createCircle } from "../body/shape";
import { Body } from "../body/body";

/**
 * Defines the parameters for creating a fire effect.
 */
export interface FireEffectOptions {
  /** The center position for the fire effect. */
  position: Vec2;
  /** The overall size multiplier for the effect. Defaults to 1. */
  size?: number;
  /** The number of particles to emit. Defaults to 50. */
  count?: number;
  /** The upward acceleration of the particles. Defaults to -0.015 */
  updraft?: number;
}

/**
 * Creates a fire-like particle emission.
 * @param options The options for the fire effect.
 * @returns A `ParticleEmissionOptions` object ready to be used with a `ParticleSystem`.
 */
export function createFireEffect(options: FireEffectOptions): ParticleEmissionOptions {
  const { position, size = 1, count = 50, updraft = -0.015 } = options;

  return {
    numParticles: count,
    position: position,
    positionJitter: 10 * size,
    particleLifetime: { min: 60, max: 120 },
    initialVelocity: { min: 0.5 * size, max: 1.5 * size },
    acceleration: new Vec2(0, updraft * size),
    scale: { start: 0.5 * size, end: 0 },
    body: Body.fromShape(createCircle(5 * size)),
    color: {
      start: new Color(255, 150, 50, 1),
      end: new Color(50, 50, 50, 0),
    },
  };
}

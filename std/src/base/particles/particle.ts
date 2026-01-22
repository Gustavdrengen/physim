import { Vec2 } from "../vec";
import { Color } from "../draw/color";
import { Body } from "../../resource/body/body";

/**
 * @internal
 * Represents the state of a single particle.
 * This is not exported and is managed internally by the ParticleSystem.
 */
export interface Particle {
  position: Vec2;
  velocity: Vec2;
  acceleration: Vec2;
  
  color: Color;
  startColor: Color;
  endColor: Color;

  body: Body;
  scale: number;
  startScale: number;
  endScale: number;

  lifetime: number; // in frames
  age: number; // in frames
}

/**
 * Defines the properties for a burst of particles to be emitted.
 */
export interface ParticleEmissionOptions {
  /** The number of particles to emit. */
  numParticles: number;
  /** The center position for the emission. */
  position: Vec2;
  /** A random offset from the center position. */
  positionJitter?: number;
  /** The lifetime of particles in frames. */
  particleLifetime: { min: number, max: number };
  /** The initial velocity range for particles. */
  initialVelocity: { min: Vec2, max: Vec2 };
  /** The start and end scale of particles, or a single number for a constant scale. Defaults to 1. */
  scale?: { start: number, end: number } | number;
  /** The start and end color of particles. */
  color: { start: Color, end: Color };
  /** A constant acceleration to apply to particles (e.g., for gravity). */
  acceleration?: Vec2;
  /** The body to use for the particles. */
  body: Body;
}

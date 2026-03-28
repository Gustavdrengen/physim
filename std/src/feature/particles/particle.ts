import { Vec2 } from "../../base/vec.ts";
import { Color } from "../../base/draw/color.ts";
import { Body } from "../bodies/body.ts";

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
  colorStages?: ColorStage[];

  body: Body;
  scale: number;
  startScale: number;
  endScale: number;
  scaleCurve?: "linear" | "easeIn" | "easeOut" | "easeInOut";

  rotation: number;
  rotationSpeed: number;

  lifetime: number; // in frames
  age: number; // in frames

  turbulence?: {
    frequency: number;
    amplitude: number;
  };

  customUpdate?: (particle: Particle, lifeRatio: number) => void;
}

/**
 * Defines a color stage for multi-gradient transitions.
 */
export interface ColorStage {
  /** The position in the particle's lifetime (0-1). */
  position: number;
  /** The color at this position. */
  color: Color;
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
  initialVelocity: {
    min: number;
    max: number;
  };
  /** Direction bias for initial velocity (0-1, where 0.5 is uniform in all directions). */
  directionBias?: {
    angle: number;
    spread: number;
  };
  acceleration?: Vec2;
  scale?: { start: number; end: number } | number;
  /** Curve type for scale interpolation. */
  scaleCurve?: "linear" | "easeIn" | "easeOut" | "easeInOut";
  body: Body;
  /** Simple two-color gradient. */
  color?: {
    start: Color;
    end: Color;
  };
  /** Multi-stage color gradient (overrides simple color if provided). */
  colorStages?: ColorStage[];
  orientToDirection?: boolean;
  /** Initial rotation of the particle. */
  rotation?: { min: number; max: number };
  /** Rotation speed in radians per frame. */
  rotationSpeed?: { min: number; max: number };
  /** Turbulence settings for natural drift. */
  turbulence?: {
    frequency: number;
    amplitude: number;
  };
  /** Custom update function for advanced effects. */
  customUpdate?: (particle: Particle, lifeRatio: number) => void;
}

import { Vec2 } from "../../../base/vec.ts";
import { Color } from "../../../base/draw/color.ts";
import { ParticleEmissionOptions, ColorStage } from "../../../feature/particles/particle.ts";
import { createCircle } from "../../../feature/bodies/shape.ts";
import { Body } from "../../../feature/bodies/body.ts";

/**
 * Defines the parameters for creating a fire effect.
 */
export interface FireEffectOptions {
  /** The center position for the fire effect. */
  position: Vec2;
  /** The overall size multiplier for the effect. Defaults to 1. */
  size?: number;
  /** The number of particles to emit per burst. Defaults to 80. */
  count?: number;
  /** The upward acceleration of the particles. Defaults to -0.02. */
  updraft?: number;
  /** The intensity of the fire (affects particle count and size). Defaults to 1. */
  intensity?: number;
  /** Wind affecting the fire horizontally. Defaults to 0. */
  wind?: number;
  /** Turbulence for flickering effect. Defaults to { frequency: 0.3, amplitude: 0.5 }. */
  turbulence?: { frequency: number; amplitude: number };
  /** The base temperature of the fire (affects color). 0 = cool (red), 1 = hot (white). Defaults to 0.7. */
  temperature?: number;
  /** Whether to emit smoke particles at the top. Defaults to false. */
  withSmoke?: boolean;
  /** Smoke emission rate (0-1). Defaults to 0.3. */
  smokeRate?: number;
}

/**
 * Creates a realistic fire-like particle emission.
 *
 * Produces particles that rise with an updraft, displaying a hot bright core
 * that transitions through orange and red tones before fading. Particles have
 * turbulence for natural flickering.
 *
 * When `withSmoke` is enabled, secondary smoke particles are emitted at the
 * top of the flame. The `smokeRate` option controls how frequently smoke
 * particles are spawned.
 *
 * @example
 * ```ts
 * import { ParticleSystem } from "physim/particles";
 * import { createFireEffect } from "physim/effects/particles";
 * import { Vec2 } from "physim/base";
 *
 * const particleSystem = new ParticleSystem(simulation.display);
 *
 * // Basic campfire
 * particleSystem.emit(createFireEffect({
 *   position: new Vec2(400, 500),
 *   size: 2,
 *   count: 100,
 *   intensity: 1.5,
 * }));
 *
 * // Intense blaze with wind
 * particleSystem.emit(createFireEffect({
 *   position: new Vec2(200, 400),
 *   size: 3,
 *   count: 200,
 *   intensity: 2,
 *   wind: 0.3,
 *   turbulence: { frequency: 0.5, amplitude: 1 },
 * }));
 * ```
 *
 * @param options The options for the fire effect.
 * @returns A `ParticleEmissionOptions` object ready to be used with a `ParticleSystem`.
 */
export function createFireEffect(options: FireEffectOptions): ParticleEmissionOptions {
  const {
    position,
    size = 1,
    count = 80,
    updraft = -0.02,
    intensity = 1,
    wind = 0,
    turbulence = { frequency: 0.3, amplitude: 0.5 },
    temperature = 0.7,
    withSmoke = false,
    smokeRate = 0.3,
  } = options;

  const adjustedCount = Math.floor(count * intensity);

  const tempClamped = Math.max(0, Math.min(1, temperature));

  const coreColor = lerpColor(
    new Color(255, 200, 50),
    new Color(255, 255, 200),
    tempClamped
  );

  const midColor = lerpColor(
    new Color(255, 150, 50),
    new Color(255, 200, 50),
    tempClamped
  );

  const outerColor = lerpColor(
    new Color(255, 80, 20),
    new Color(255, 150, 50),
    tempClamped
  );

  const smokeStartColor = new Color(80, 80, 80, 0.4);
  const smokeEndColor = new Color(40, 40, 40, 0);

  const colorStages: ColorStage[] = [
    { position: 0, color: coreColor.withAlpha(1) },
    { position: 0.15, color: coreColor.withAlpha(0.9) },
    { position: 0.3, color: midColor.withAlpha(0.8) },
    { position: 0.5, color: outerColor.withAlpha(0.6) },
    { position: 0.7, color: new Color(150, 50, 20, 0.3) },
    { position: 1, color: withSmoke ? smokeStartColor : new Color(50, 50, 50, 0) },
  ];

  return {
    numParticles: adjustedCount,
    position: position,
    positionJitter: 15 * size,
    particleLifetime: { min: 0.67 * size, max: 1.33 * size },
    initialVelocity: { min: 48 * size, max: 150 * size },
    directionBias: {
      angle: -Math.PI / 2,
      spread: 0.8,
    },
    acceleration: new Vec2(wind * 30, updraft * size * 60),
    scale: { start: 0.3 * size, end: 1.5 * size },
    scaleCurve: "easeOut",
    body: Body.fromShape(createCircle(6 * size)),
    colorStages,
    turbulence,
    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -6, max: 6 },
    customUpdate: withSmoke
      ? (particle, lifeRatio) => {
          if (lifeRatio > 0.7 && Math.random() < smokeRate * 0.1) {
            particle.scale *= 1.02;
          }
        }
      : undefined,
  };
}

function lerpColor(a: Color, b: Color, t: number): Color {
  return new Color(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
    a.a + (b.a - a.a) * t
  );
}

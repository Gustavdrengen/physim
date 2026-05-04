import { Vec2 } from "../../../base/vec.ts";
import { Color } from "../../../base/draw/color.ts";
import { ParticleEmissionOptions, ColorStage } from "../../../feature/particles/particle.ts";
import { createCircle } from "../../../feature/bodies/shape.ts";
import { Body } from "../../../feature/bodies/body.ts";

/**
 * Defines the parameters for creating a smoke effect.
 */
export interface SmokeEffectOptions {
  /** The center position for the smoke effect. */
  position: Vec2;
  /** The overall size multiplier for the effect. Defaults to 1. */
  size?: number;
  /**
   * Multiplier for the intensity of the effect.
   * Scales particle count, rise speed, and expansion proportionally.
   * A value of 0.5 produces a light wisp, 1 is the default, and 2 is a thick cloud.
   * Defaults to 1.
   */
  intensity?: number;
  /** The number of particles to emit per burst. Defaults to 40. */
  count?: number;
  /** The upward acceleration of the particles. Defaults to -0.008. */
  riseSpeed?: number;
  /** Wind affecting the smoke horizontally. Defaults to 0.1. */
  wind?: number;
  /** Turbulence for natural dispersion. Defaults to { frequency: 0.15, amplitude: 0.8 }. */
  turbulence?: { frequency: number; amplitude: number };
  /** The darkness of the smoke (0 = light/white, 1 = dark/black). Defaults to 0.3. */
  density?: number;
  /** How fast the smoke expands. Defaults to 1. */
  expansion?: number;
  /** The shape of the smoke emission cone in radians. Defaults to 0.5. */
  spread?: number;
}

/**
 * Creates a realistic smoke-like particle emission.
 *
 * The smoke effect features slow rising particles with natural drift,
 * gradual expansion, and color fading from gray to transparent.
 *
 * @example
 * ```ts
 * import { ParticleSystem } from "physim/particles";
 * import { createSmokeEffect } from "physim/effects/particles";
 * import { Vec2 } from "physim/base";
 *
 * const particleSystem = new ParticleSystem(simulation.display);
 *
 * // Light smoke from a candle
 * particleSystem.emit(createSmokeEffect({
 *   position: new Vec2(400, 300),
 *   size: 1,
 *   count: 20,
 *   density: 0.2,
 * }));
 *
 * // Thick smoke from a fire
 * particleSystem.emit(createSmokeEffect({
 *   position: new Vec2(400, 200),
 *   size: 2,
 *   count: 60,
 *   density: 0.5,
 *   expansion: 1.5,
 *   turbulence: { frequency: 0.1, amplitude: 1.2 },
 * }));
 * ```
 *
 * @param options The options for the smoke effect.
 * @returns A `ParticleEmissionOptions` object ready to be used with a `ParticleSystem`.
 */
export function createSmokeEffect(options: SmokeEffectOptions): ParticleEmissionOptions {
  const {
    position,
    size = 1,
    intensity = 1,
    count = 40,
    riseSpeed = -0.008,
    wind = 0.1,
    turbulence = { frequency: 0.15, amplitude: 0.8 },
    density = 0.3,
    expansion = 1,
    spread = 0.5,
  } = options;

  const i = Math.max(0, intensity);
  const densityClamped = Math.max(0, Math.min(1, density));

  const baseGray = Math.floor(100 + densityClamped * 100);
  const startAlpha = 0.3 + densityClamped * 0.4;

  const colorStages: ColorStage[] = [
    { position: 0, color: new Color(baseGray, baseGray, baseGray, startAlpha) },
    { position: 0.3, color: new Color(baseGray + 20, baseGray + 20, baseGray + 20, startAlpha * 0.8) },
    { position: 0.6, color: new Color(baseGray + 40, baseGray + 40, baseGray + 40, startAlpha * 0.5) },
    { position: 1, color: new Color(baseGray + 60, baseGray + 60, baseGray + 60, 0) },
  ];

  return {
    numParticles: Math.round(count * i),
    position: position,
    positionJitter: 8 * size * i,
    particleLifetime: { min: 2 * size, max: 3.33 * size },
    initialVelocity: { min: 18 * size * i, max: 48 * size * i },
    directionBias: {
      angle: -Math.PI / 2,
      spread: spread,
    },
    acceleration: new Vec2(wind * 18, riseSpeed * size * 60),
    scale: { start: 0.5 * size, end: 3 * size * expansion },
    scaleCurve: "easeInOut",
    body: Body.fromShape(createCircle(8 * size)),
    colorStages,
    turbulence,
    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -3, max: 3 },
  };
}

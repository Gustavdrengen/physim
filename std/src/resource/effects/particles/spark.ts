import { Vec2 } from "../../../base/vec.ts";
import { Color } from "../../../base/draw/color.ts";
import { ParticleEmissionOptions, ColorStage } from "../../../feature/particles/particle.ts";
import { createCircle } from "../../../feature/bodies/shape.ts";
import { Body } from "../../../feature/bodies/body.ts";

/**
 * Defines the parameters for creating a spark effect.
 */
export interface SparkEffectOptions {
  /** The center position for the spark effect. */
  position: Vec2;
  /** The overall size multiplier for the effect. Defaults to 1. */
  size?: number;
  /** The number of particles to emit per burst. Defaults to 50. */
  count?: number;
  /** The initial velocity of sparks. Defaults to { min: 3, max: 8 }. */
  velocity?: { min: number; max: number };
  /** Gravity affecting the sparks. Defaults to 0.015. */
  gravity?: number;
  /** Air resistance slowing down sparks. Defaults to 0.98. */
  drag?: number;
  /** The brightness/temperature of sparks (0 = orange, 1 = white). Defaults to 0.8. */
  brightness?: number;
  /** The direction bias for sparks. Defaults to upward cone. */
  direction?: { angle: number; spread: number };
  /** Whether sparks should fade out quickly (true) or burn longer (false). Defaults to true. */
  quickFade?: boolean;
  /** Variation in spark sizes. Defaults to 1. */
  sizeVariation?: number;
}

/**
 * Creates a realistic spark-like particle emission.
 *
 * Sparks are bright, fast-moving particles that follow a ballistic trajectory
 * with gravity and drag. They have intense colors that fade quickly.
 *
 * @example
 * ```ts
 * import { ParticleSystem } from "physim/particles";
 * import { createSparkEffect } from "physim/effects/particles";
 * import { Vec2 } from "physim/base";
 *
 * const particleSystem = new ParticleSystem(simulation.display);
 *
 * // Welding sparks
 * particleSystem.emit(createSparkEffect({
 *   position: new Vec2(400, 400),
 *   size: 0.5,
 *   count: 100,
 *   velocity: { min: 5, max: 12 },
 *   direction: { angle: Math.PI / 4, spread: 1 },
 * }));
 *
 * // Campfire sparks
 * particleSystem.emit(createSparkEffect({
 *   position: new Vec2(400, 350),
 *   size: 0.8,
 *   count: 30,
 *   velocity: { min: 2, max: 5 },
 *   direction: { angle: -Math.PI / 2, spread: 0.8 },
 *   brightness: 0.6,
 * }));
 *
 * // Firework burst
 * particleSystem.emit(createSparkEffect({
 *   position: new Vec2(400, 200),
 *   size: 1,
 *   count: 200,
 *   velocity: { min: 4, max: 10 },
 *   direction: { angle: 0, spread: Math.PI * 2 },
 *   gravity: 0.02,
 * }));
 * ```
 *
 * @param options The options for the spark effect.
 * @returns A `ParticleEmissionOptions` object ready to be used with a `ParticleSystem`.
 */
export function createSparkEffect(options: SparkEffectOptions): ParticleEmissionOptions {
  const {
    position,
    size = 1,
    count = 50,
    velocity = { min: 3, max: 8 },
    gravity = 0.015,
    drag = 0.98,
    brightness = 0.8,
    direction = { angle: -Math.PI / 2, spread: 0.8 },
    quickFade = true,
    sizeVariation = 1,
  } = options;

  const brightnessClamped = Math.max(0, Math.min(1, brightness));

  const hotColor = new Color(255, 255, 200);
  const warmColor = new Color(255, 200, 100);
  const coolColor = new Color(255, 100, 50);

  const coreColor = lerpColor(coolColor, hotColor, brightnessClamped);
  const midColor = lerpColor(warmColor, hotColor, brightnessClamped);

  const lifetimeMin = quickFade ? 20 : 40;
  const lifetimeMax = quickFade ? 40 : 70;

  const colorStages: ColorStage[] = [
    { position: 0, color: coreColor.withAlpha(1) },
    { position: 0.1, color: midColor.withAlpha(0.9) },
    { position: 0.4, color: new Color(255, 150, 50, 0.6) },
    { position: 0.7, color: new Color(200, 80, 30, 0.3) },
    { position: 1, color: new Color(100, 50, 20, 0) },
  ];

  return {
    numParticles: count,
    position: position,
    positionJitter: 5 * size,
    particleLifetime: { min: lifetimeMin * size, max: lifetimeMax * size },
    initialVelocity: { min: velocity.min * size, max: velocity.max * size },
    directionBias: direction,
    acceleration: new Vec2(0, gravity * size),
    scale: { start: 0.2 * size * sizeVariation, end: 0 },
    scaleCurve: "easeOut",
    body: Body.fromShape(createCircle(3 * size)),
    colorStages,
    turbulence: { frequency: 0.5, amplitude: 0.2 },
    rotation: { min: 0, max: Math.PI * 2 },
    rotationSpeed: { min: -0.2, max: 0.2 },
    customUpdate: drag !== 1
      ? (particle, lifeRatio) => {
          particle.velocity = particle.velocity.scale(drag);
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

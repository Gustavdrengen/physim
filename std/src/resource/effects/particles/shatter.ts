import { Entity } from "../../../base/entity.ts";
import { ParticleSystem } from "../../../feature/particles/system.ts";
import { Body } from "../../../feature/bodies/body.ts";
import { Color } from "../../../base/draw/color.ts";
import { Vec2 } from "../../../base/vec.ts";

/**
 * Options for the shatter effect.
 */
export interface ShatterOptions {
  /** The number of shards to split the body into. */
  numShards: number;
  /** The lifetime of the shards in seconds. */
  lifetime: { min: number; max: number };
  /** The speed range for the shards (simulation units per second). */
  speed: { min: number; max: number };
  /** The color of the shards. Defaults to the body's display color if available. */
  color?: { start: Color; end: Color };
  /** Scale range for the shards. */
  scale?: { start: number; end: number } | number;
  /**
   * Multiplier for the intensity of the shatter.
   * Scales the number of shards, speed, and lifetime proportionally.
   * A value of 0.5 produces a soft split, 1 is the default, and 2 is an explosive shatter.
   * Defaults to 1.
   */
  intensity?: number;
}

/**
 * Shatters an entity into multiple shards that are emitted as particles.
 * The original entity is destroyed in the process.
 *
 * @param entity The entity to shatter.
 * @param body The body of the entity.
 * @param particleSystem The particle system to emit shards into.
 * @param options Shatter options.
 */
export function shatter(
  entity: Entity,
  body: Body,
  particleSystem: ParticleSystem,
  options: ShatterOptions
): void {
  const i = Math.max(0, options.intensity ?? 1);
  const adjustedNumShards = Math.round(options.numShards * i);
  const shards = Body.split(body, adjustedNumShards);

  const shardColor = options.color || {
    start: new Color(255, 255, 255, 1),
    end: new Color(255, 255, 255, 0),
  };

  for (const shard of shards) {
    const angle = Math.random() * Math.PI * 2;
    const baseSpeed = options.speed.min + Math.random() * (options.speed.max - options.speed.min);
    const speed = baseSpeed * i;
    const lifetime = {
      min: options.lifetime.min * i,
      max: options.lifetime.max * i,
    };

    particleSystem.emit({
      numParticles: 1,
      position: entity.pos,
      particleLifetime: lifetime,
      initialVelocity: { min: speed, max: speed },
      body: shard,
      color: shardColor,
      scale: options.scale ?? 1,
    });
  }

  // Destroy the original entity
  entity.destroy();
}

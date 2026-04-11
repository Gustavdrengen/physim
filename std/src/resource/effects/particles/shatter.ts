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
  /** The speed range for the shards (pixels per second). */
  speed: { min: number; max: number };
  /** The color of the shards. Defaults to the body's display color if available. */
  color?: { start: Color; end: Color };
  /** Scale range for the shards. */
  scale?: { start: number; end: number } | number;
}

/**
 * Shatters an entity into multiple shards that are emitted as particles.
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
  const shards = Body.split(body, options.numShards);
  
  const shardColor = options.color || {
    start: new Color(255, 255, 255, 1),
    end: new Color(255, 255, 255, 0),
  };

  for (const shard of shards) {
    const angle = Math.random() * Math.PI * 2;
    const speed = options.speed.min + Math.random() * (options.speed.max - options.speed.min);
    
    particleSystem.emit({
      numParticles: 1,
      position: entity.pos,
      particleLifetime: options.lifetime,
      initialVelocity: { min: speed, max: speed },
      body: shard,
      color: shardColor,
      scale: options.scale ?? 1,
    });
  }

  // Destroy the original entity
  entity.destroy();
}

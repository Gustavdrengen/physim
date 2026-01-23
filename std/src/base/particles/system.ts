import { Vec2 } from "../vec";
import { Color } from "../draw/color";
import { Particle, ParticleEmissionOptions } from "./particle";
import { Camera } from "../camera";
import { Body } from "../../resource/body/body"; 

/**
 * A system for creating and managing particles.
 */
export class ParticleSystem {
  private activeParticles: Particle[] = [];
  private particlePool: Particle[] = [];

  /**
   * Creates a new particle system.
   */
  constructor() { }

  /**
   * Updates the state of all active particles.
   * This should be called once per frame.
   */
  public update(): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.age++;

      if (p.age >= p.lifetime) {
        this.particlePool.push(p);
        this.activeParticles.splice(i, 1);
        continue;
      }

      p.velocity = p.velocity.add(p.acceleration);
      p.position = p.position.add(p.velocity);

      const lifeRatio = p.age / p.lifetime;
      p.scale = p.startScale + (p.endScale - p.startScale) * lifeRatio;

      const r = p.startColor.r + (p.endColor.r - p.startColor.r) * lifeRatio;
      const g = p.startColor.g + (p.endColor.g - p.startColor.g) * lifeRatio;
      const b = p.startColor.b + (p.endColor.b - p.startColor.b) * lifeRatio;
      const a = p.startColor.a + (p.endColor.a - p.startColor.a) * lifeRatio;
      p.color = new Color(r, g, b, a);
    }
  }

  /**
   * Renders all active particles.
   * This should be called once per frame.
   * @param camera The camera to use for rendering.
   */
  public draw(camera: Camera): void {
    camera._applyTransforms(sim.ctx);
    for (const p of this.activeParticles) {
      p.body.draw(p.position, p.color, true, 1, p.scale);
    }
    camera._removeTransforms(sim.ctx);
  }

  /**
   * Emits a burst of particles with the specified properties.
   * @param options The properties for the particles to be emitted.
   */
  public emit(options: ParticleEmissionOptions): void {
    for (let i = 0; i < options.numParticles; i++) {
      const p = this.particlePool.pop() || {} as Particle;

      p.age = 0;
      p.lifetime = options.particleLifetime.min +
        Math.random() * (options.particleLifetime.max - options.particleLifetime.min);

      const jitter = options.positionJitter || 0;
      const jitterX = (Math.random() - 0.5) * jitter;
      const jitterY = (Math.random() - 0.5) * jitter;
      p.position = options.position.add(new Vec2(jitterX, jitterY));

      const randomAngle = Math.random() * Math.PI * 2;
      const randomMagnitude = options.initialVelocity.min +
        Math.random() * (options.initialVelocity.max - options.initialVelocity.min);
      p.velocity = new Vec2(
        Math.cos(randomAngle) * randomMagnitude,
        Math.sin(randomAngle) * randomMagnitude,
      );

      p.acceleration = options.acceleration || new Vec2(0, 0);

      const scale = options.scale ?? 1;
      if (typeof scale === 'number') {
        p.startScale = scale;
        p.endScale = scale;
      } else {
        p.startScale = scale.start;
        p.endScale = scale.end;
      }
      p.scale = p.startScale;

      if (options.orientToDirection) {
        p.body = new Body([...options.body.parts], p.velocity.angle());
      } else {
        p.body = new Body([...options.body.parts], options.body.rotation);
      }

      p.startColor = options.color.start;
      p.endColor = options.color.end;
      p.color = p.startColor;

      this.activeParticles.push(p);
    }
  }
}

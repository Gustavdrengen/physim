import { Vec2 } from "../../base/vec.ts";
import { Color } from "../../base/draw/color.ts";
import { Particle, ParticleEmissionOptions, ColorStage } from "./particle.ts";
import { Camera } from "../../base/camera.ts";
import { Body } from "../bodies/body.ts";
import { Component, Entity } from "../../base/entity.ts";
import { TrailOptions } from "./trail.ts";
import { Display } from "../../base/display.ts";

/**
 * A system for creating and managing particles.
 */
export class ParticleSystem {
  private activeParticles: Particle[] = [];
  private particlePool: Particle[] = [];

  /**
   * A component that can be added to entities to create a particle trail.
   * The particle system instance will automatically handle emitting particles
   * for any entity that has this component.
   *
   * @example
   * ```ts
   * import { ParticleSystem } from "physim/particles";
   * import { Circle, Color, Vec2 } from "physim/base";
   *
   * const particleSystem = new ParticleSystem(simulation.display);
   *
   * const entity = simulation.entities.create({
   *   pos: new Vec2(100, 100),
   *   vel: new Vec2(50, 0),
   * });
   *
   * entity.add(particleSystem.trailComponent, {
   *   interval: 0.05,
   *   particleLifetime: 0.5,
   *   body: new Circle(3),
   *   color: {
   *     start: Color.fromHex("#00ffff"),
   *     end: Color.fromHex("#0000ff"),
   *   },
   *   scale: { start: 1, end: 0 },
   *   acceleration: { x: 0, y: 50 },
   * });
   * ```
   *
   * @example
   * ```ts
   * import { ParticleSystem } from "physim/particles";
   * import { Square, Color, Vec2 } from "physim/base";
   *
   * const particleSystem = new ParticleSystem(simulation.display);
   *
   * const player = simulation.entities.create({ pos: new Vec2(200, 200) });
   *
   * player.add(particleSystem.trailComponent, {
   *   interval: 0.02,
   *   particleLifetime: 0.3,
   *   body: new Square(4),
   *   color: {
   *     start: Color.fromHex("#ff6600"),
   *     end: Color.fromHex("#ff0000"),
   *   },
   *   scale: 0.5,
   *   positionJitter: 5,
   *   orientToDirection: true,
   * });
   * ```
   */
  public readonly trailComponent: Component<TrailOptions | TrailOptions[]>;

  /**
   * Creates a new particle system.
   * @param display The display to automatically render the particles to.
   */
  constructor(display: Display) {
    this.trailComponent = new Component<TrailOptions | TrailOptions[]>();
    display.addStatic((camera) => {
      this.update();
      this.draw(camera);
    });
  }

  // @profile "ParticleSystem.update"
  private update(): void {
    const dt = 1 / 60;
    
    // @profile-start "ParticleSystem.update.particles"
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.age += dt;

      p.velocity = p.velocity.add(p.acceleration.scale(dt));
      
      if (p.turbulence) {
        const noiseX = Math.sin(p.age * p.turbulence.frequency) * p.turbulence.amplitude;
        const noiseY = Math.cos(p.age * p.turbulence.frequency * 0.7) * p.turbulence.amplitude;
        p.velocity = p.velocity.add(new Vec2(noiseX * dt, noiseY * dt));
      }

      p.position = p.position.add(p.velocity.scale(dt));

      const lifeRatio = p.age / p.lifetime;
      
      let scaleRatio = lifeRatio;
      if (p.scaleCurve === "easeIn") {
        scaleRatio = lifeRatio * lifeRatio;
      } else if (p.scaleCurve === "easeOut") {
        scaleRatio = 1 - (1 - lifeRatio) * (1 - lifeRatio);
      } else if (p.scaleCurve === "easeInOut") {
        scaleRatio = lifeRatio < 0.5 
          ? 2 * lifeRatio * lifeRatio 
          : 1 - Math.pow(-2 * lifeRatio + 2, 2) / 2;
      }
      p.scale = p.startScale + (p.endScale - p.startScale) * scaleRatio;

      if (p.colorStages && p.colorStages.length > 0) {
        p.color = this.interpolateColorStages(p.colorStages, lifeRatio);
      } else {
        const r = p.startColor.r + (p.endColor.r - p.startColor.r) * lifeRatio;
        const g = p.startColor.g + (p.endColor.g - p.startColor.g) * lifeRatio;
        const b = p.startColor.b + (p.endColor.b - p.startColor.b) * lifeRatio;
        const a = p.startColor.a + (p.endColor.a - p.startColor.a) * lifeRatio;
        p.color = new Color(r, g, b, a);
      }

      p.rotation += p.rotationSpeed * dt;

      if (p.customUpdate) {
        p.customUpdate(p, lifeRatio);
      }

      if (p.age >= p.lifetime) {
        this.particlePool.push(p);
        this.activeParticles.splice(i, 1);
        continue;
      }
    }
    // @profile-end

    // @profile-start "ParticleSystem.update.trails"
    for (const [entity, trailData] of this.trailComponent.entries()) {
      const trails = Array.isArray(trailData) ? trailData : [trailData];
      for (const trail of trails) {
        trail._timeAccumulator = (trail._timeAccumulator ?? 0) + dt;
        if (trail._timeAccumulator >= trail.interval) {
          trail._timeAccumulator = 0;
          this.emit({
            numParticles: 1,
            position: entity.pos,
            positionJitter: trail.positionJitter,
            particleLifetime: {
              min: trail.particleLifetime,
              max: trail.particleLifetime,
            },
            initialVelocity: { min: 0, max: 0 },
            acceleration: trail.acceleration
              ? new Vec2(trail.acceleration.x, trail.acceleration.y)
              : undefined,
            scale: trail.scale,
            body: trail.body,
            color: trail.color,
            orientToDirection: trail.orientToDirection,
          });
        }
      }
    }
    // @profile-end
  }

  // @profile "ParticleSystem.draw"
  private draw(camera: Camera): void {
    camera._applyTransforms(sim.ctx);
    // @profile-start "ParticleSystem.draw.particles"
    for (const p of this.activeParticles) {
      p.body.draw(p.position, p.color, true, 1, p.scale);
    }
    // @profile-end
    camera._removeTransforms(sim.ctx);
  }

  // @profile "ParticleSystem.interpolateColorStages"
  private interpolateColorStages(stages: ColorStage[], lifeRatio: number): Color {
    if (lifeRatio <= 0) return stages[0].color;
    if (lifeRatio >= 1) return stages[stages.length - 1].color;

    for (let i = 0; i < stages.length - 1; i++) {
      const current = stages[i];
      const next = stages[i + 1];
      if (lifeRatio >= current.position && lifeRatio <= next.position) {
        const segmentRatio = (lifeRatio - current.position) / (next.position - current.position);
        const r = current.color.r + (next.color.r - current.color.r) * segmentRatio;
        const g = current.color.g + (next.color.g - current.color.g) * segmentRatio;
        const b = current.color.b + (next.color.b - current.color.b) * segmentRatio;
        const a = current.color.a + (next.color.a - current.color.a) * segmentRatio;
        return new Color(r, g, b, a);
      }
    }

    return stages[stages.length - 1].color;
  }

  /**
   * Emits a burst of particles with the specified properties.
   * @param options The properties for the particles to be emitted.
   */
  // @profile "ParticleSystem.emit"
  public emit(options: ParticleEmissionOptions): void {
    // @profile-start "ParticleSystem.emit.loop"
    for (let i = 0; i < options.numParticles; i++) {
      const p = this.particlePool.pop() || {} as Particle;

      p.age = 0;
      p.lifetime =
        options.particleLifetime.min +
        Math.random() * (options.particleLifetime.max - options.particleLifetime.min);

      const jitter = options.positionJitter || 0;
      const jitterX = (Math.random() - 0.5) * jitter;
      const jitterY = (Math.random() - 0.5) * jitter;
      p.position = options.position.add(new Vec2(jitterX, jitterY));

      let randomAngle: number;
      if (options.directionBias) {
        const baseAngle = options.directionBias.angle;
        const spread = options.directionBias.spread;
        randomAngle = baseAngle + (Math.random() - 0.5) * spread;
      } else {
        randomAngle = Math.random() * Math.PI * 2;
      }
      const randomMagnitude =
        options.initialVelocity.min +
        Math.random() * (options.initialVelocity.max - options.initialVelocity.min);
      p.velocity = new Vec2(
        Math.cos(randomAngle) * randomMagnitude,
        Math.sin(randomAngle) * randomMagnitude
      );

      p.acceleration = options.acceleration || new Vec2(0, 0);

      const scale = options.scale ?? 1;
      if (typeof scale === "number") {
        p.startScale = scale;
        p.endScale = scale;
      } else {
        p.startScale = scale.start;
        p.endScale = scale.end;
      }
      p.scale = p.startScale;
      p.scaleCurve = options.scaleCurve;

      if (options.orientToDirection) {
        p.body = new Body([...options.body.parts], p.velocity.angle());
      } else {
        p.body = new Body([...options.body.parts], options.body.rotation);
      }

      if (options.colorStages) {
        p.colorStages = options.colorStages;
        p.color = options.colorStages[0].color;
        p.startColor = options.colorStages[0].color;
        p.endColor = options.colorStages[options.colorStages.length - 1].color;
      } else if (options.color) {
        p.startColor = options.color.start;
        p.endColor = options.color.end;
        p.color = p.startColor;
      }

      const rot = options.rotation;
      p.rotation = rot ? rot.min + Math.random() * (rot.max - rot.min) : 0;
      const rotSpeed = options.rotationSpeed;
      p.rotationSpeed = rotSpeed ? rotSpeed.min + Math.random() * (rotSpeed.max - rotSpeed.min) : 0;

      p.turbulence = options.turbulence;
      p.customUpdate = options.customUpdate;

      this.activeParticles.push(p);
    }
    // @profile-end
  }
}

declare const sim: any;


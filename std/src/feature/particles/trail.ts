import { Color } from "../../base/draw/color.ts";
import { Body } from "../bodies/body.ts";

/**
 * Configuration for a particle trail effect that follows an entity.
 *
 * Trails automatically emit particles from entities at regular intervals.
 * All time values are specified in seconds.
 */
export interface TrailOptions {
  /**
   * The time in seconds between each particle emission.
   *
   * Lower values create denser trails.
   *
   * @example
   * ```ts
   * interval: 0.02   // Dense trail
   * interval: 0.1    // Medium density
   * interval: 0.5    // Sparse trail
   * ```
   */
  interval: number;

  /**
   * The lifetime of particles in seconds.
   *
   * @example
   * ```ts
   * particleLifetime: 1.0  // Particles last 1 second
   * particleLifetime: 0.3  // Particles last 300ms
   * ```
   */
  particleLifetime: number;

  /**
   * A constant acceleration applied to each particle (pixels per second squared).
   *
   * Useful for simulating gravity or wind effects.
   *
   * @example
   * ```ts
   * acceleration: { x: 0, y: 100 }    // Downward gravity
   * acceleration: { x: -50, y: 0 }    // Leftward wind
   * acceleration: { x: 0, y: -50 }    // Upward float
   * ```
   */
  acceleration?: { x: number; y: number };

  /**
   * The scale of the particles over their lifetime.
   *
   * Can be a single number for constant scale, or a range for scaling
   * over the particle's lifetime. Scale is interpolated linearly.
   *
   * @example
   * ```ts
   * scale: 1                        // Constant size
   * scale: { start: 1, end: 0 }     // Shrink to nothing
   * scale: { start: 0, end: 1 }     // Grow from nothing
   * scale: { start: 1.5, end: 0.5 } // Shrink slightly
   * ```
   */
  scale?: { start: number; end: number } | number;

  /**
   * The body to use for each particle.
   *
   * @example
   * ```ts
   * body: Body.fromShape(createCircle(3))
   * body: Body.fromShape(createRectangle(6, 6))
   * body: Body.fromShape(createPolygon([new Vec2(0, -5), new Vec2(4, 5), new Vec2(-4, 5)]))
   * ```
   */
  body: Body;

  /**
   * The color gradient of the particles over their lifetime.
   *
   * Colors are interpolated linearly from start to end.
   *
   * @example
   * ```ts
   * color: {
   *   start: Color.fromHex("#ffff00"),
   *   end: Color.fromHex("#ff0000"),
   * }
   * ```
   */
  color: {
    start: Color;
    end: Color;
  };

  /**
   * If true, particles rotate to face their movement direction.
   *
   * Useful for arrow-shaped or directional particles.
   *
   * @default false
   */
  orientToDirection?: boolean;

  /**
   * Random offset from the emitter's position in pixels.
   *
   * Adds variation to particle spawn positions for a more natural look.
   *
   * @example
   * ```ts
   * positionJitter: 0   // Exact position
   * positionJitter: 5   // Small variation
   * positionJitter: 10  // Larger variation
   * ```
   */
  positionJitter?: number;

  /**
   * @internal
   * Internal state for managing emission timing.
   */
  _timeAccumulator?: number;
}

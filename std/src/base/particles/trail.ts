import { Color } from "../draw/color";
import { Body } from "../../resource/body/body";

/**
 * Defines the configuration for a particle trail effect.
 */
export interface TrailOptions {
  /**
   * The number of frames between each particle emission.
   */
  interval: number;
  /**
   * The lifetime of particles in frames.
   */
  particleLifetime: number;
  /**
   * A constant acceleration applied to each particle.
   */
  acceleration?: { x: number; y: number };
  /**
   * The scale of the particles over their lifetime.
   * Can be a single number for constant scale, or a start/end range.
   */
  scale?: { start: number; end: number } | number;
  /**
   * The body shape to use for each particle.
   */
  body: Body;
  /**
   * The color of the particles over their lifetime.
   */
  color: {
    start: Color;
    end: Color;
  };
  /**
   * If true, particles will be oriented in the direction of their velocity.
   * Defaults to false.
   */
  orientToDirection?: boolean;
  /**
   * A random offset from the emitter's position.
   */
  positionJitter?: number;

  /**
   * @internal
   * Internal state for managing emission timing.
   */
  _frameCounter?: number;
}

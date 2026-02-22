import { Entity } from "./entity.ts";
import { Vec2 } from "./vec.ts";

/**
 * A camera for controlling the view of the simulation.
 *
 * @example
 * ```ts
 * import { Camera } from "physim/display";
 * import { Vec2 } from "physim/vec";
 *
 * const camera = new Camera();
 * camera.position = new Vec2(100, 100);
 * camera.zoom = 2;
 * ```
 */
export class Camera {
  /**
   * The position of the camera in the world.
   */
  position: Vec2;

  /**
   * The zoom level of the camera.
   */
  zoom: number;

  /**
   * The rotation of the camera in radians.
   */
  rotation: number;

  /**
   * The entity or entities that the camera is following.
   *
   * @see {Camera.follow}
   */
  target: Entity | Entity[] | null;

  /**
   * @internal
   */
  shakeTime: number;
  /**
   * @internal
   */
  shakeIntensity: number;
  /**
   * @internal
   */
  shakeOffset: Vec2;

  /**
   * Creates a new Camera instance.
   */
  constructor() {
    this.position = Vec2.zero();
    this.zoom = 1;
    this.rotation = 0;
    this.target = null;
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.shakeOffset = Vec2.zero();
  }

  /**
   * Shakes the camera for a given amount of time and intensity.
   * @param time The duration of the shake in frames.
   * @param intensity The magnitude of the shake.
   */
  shake(time: number, intensity: number) {
    this.shakeTime = time;
    this.shakeIntensity = intensity;
  }

  /**
   * @internal
   */
  update() {
    if (this.target) {
      if (Array.isArray(this.target)) {
        this.position = Vec2.average(this.target.map((e) => e.pos));
      } else {
        this.position = this.target.pos;
      }
    }

    if (this.shakeTime > 0) {
      this.shakeOffset = Vec2.random(this.shakeIntensity);
      this.shakeTime--;
    } else {
      this.shakeOffset = Vec2.zero();
    }
  }

  /**
   * Sets the camera to follow an entity or a group of entities.
   * @param entity The entity or entities to follow.
   */
  follow(entity: Entity | Entity[]) {
    this.target = entity;
  }

  /**
   * @internal
   */
  _applyTransforms(ctx: CanvasRenderingContext2D) {
    this.update();
    const pos = this.position.add(this.shakeOffset);

    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.rotate(this.rotation);
    ctx.translate(-pos.x, -pos.y);
  }

  /**
   * @internal
   */
  _removeTransforms(ctx: CanvasRenderingContext2D) {
    ctx.restore();
  }
}

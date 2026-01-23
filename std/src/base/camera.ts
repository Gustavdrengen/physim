
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
   * Converts a point from world coordinates to screen coordinates.
   * @param worldPos The position in world coordinates.
   * @returns The position in screen coordinates.
   */
  worldToScreen(worldPos: Vec2): Vec2 {
    const pos = this.position.add(this.shakeOffset);
    const dx = worldPos.x - pos.x;
    const dy = worldPos.y - pos.y;

    const rotatedX =
      dx * Math.cos(-this.rotation) - dy * Math.sin(-this.rotation);
    const rotatedY =
      dx * Math.sin(-this.rotation) + dy * Math.cos(-this.rotation);

    return new Vec2(rotatedX * this.zoom, rotatedY * this.zoom);
  }

  /**
   * Converts a point from screen coordinates to world coordinates.
   * @param screenPos The position in screen coordinates.
   * @returns The position in world coordinates.
   */
  screenToWorld(screenPos: Vec2): Vec2 {
    const rotatedX = screenPos.x / this.zoom;
    const rotatedY = screenPos.y / this.zoom;

    const dx =
      rotatedX * Math.cos(this.rotation) - rotatedY * Math.sin(this.rotation);
    const dy =
      rotatedX * Math.sin(this.rotation) + rotatedY * Math.cos(this.rotation);

    const pos = this.position.add(this.shakeOffset);
    return new Vec2(dx + pos.x, dy + pos.y);
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

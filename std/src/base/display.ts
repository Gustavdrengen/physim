import { Camera } from "./camera.ts";
import { clear } from "./draw/shapes.ts";
import { Component, Entity } from "./entity.ts";
import { Vec2 } from "./vec.ts";

/**
 * The `Display` class is responsible for drawing entities on the canvas.
 *
 * @example
 * ```ts
 * import { Display, Component, Entity, Vec2, Camera } from "physim";
 *
 * const display = new Display();
 * const camera = new Camera();
 *
 * const position = new Component<Vec2>();
 *
 * display.registerDrawComponent(position, (entity, data) => {
 *   // Draw the entity
 * });
 *
 * sim.onUpdate = () => {
 *   display.draw(camera);
 * }
 * ```
 */
export class Display {
  private drawComponents: Map<
    Component<any>,
    (entity: Entity, data: any) => void
  > = new Map();

  /**
   * Registers a draw function for a component.
   *
   * @param comp The component to register.
   * @param drawFunc The function to call to draw the component.
   */
  registerDrawComponent<T>(
    comp: Component<T>,
    drawFunc: (entity: Entity, data: T) => void
  ) {
    this.drawComponents.set(comp, drawFunc);
  }

  /**
   * Draws all registered components.
   * @param camera The camera to use for rendering. If not provided, a default camera is used.
   */
  draw(camera?: Camera) {
    const effectiveCamera = camera ?? new Camera();

    if (effectiveCamera.target) {
      if (Array.isArray(effectiveCamera.target)) {
        const positions = effectiveCamera.target.map((e) => e.pos);
        effectiveCamera.position = Vec2.average(positions);
      } else {
        effectiveCamera.position = effectiveCamera.target.pos;
      }
    }

    clear();
    effectiveCamera._applyTransforms(sim.ctx);

    for (const [comp, drawFunc] of this.drawComponents) {
      for (const entity of comp.keys()) {
        drawFunc(entity, comp.get(entity));
      }
    }

    effectiveCamera._removeTransforms(sim.ctx);
  }
}

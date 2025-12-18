import { clear } from "./draw/shapes.ts";
import { Component, Entity } from "./entity.ts";

/**
 * The `Display` class is responsible for drawing entities on the canvas.
 *
 * @example
 * ```ts
 * import { Display, Component, Entity, Vec2 } from "physim";
 *
 * const display = new Display();
 *
 * const position = new Component<Vec2>();
 *
 * display.registerDrawComponent(position, (entity, data) => {
 *   // Draw the entity
 * });
 *
 * sim.onUpdate = () => {
 *   display.draw();
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
    drawFunc: (entity: Entity, data: T) => void,
  ) {
    this.drawComponents.set(comp, drawFunc);
  }

  /**
   * Draws all registered components.
   */
  draw() {
    clear();
    for (const [comp, drawFunc] of this.drawComponents) {
      for (const entity of comp.keys()) {
        drawFunc(entity, comp.get(entity));
      }
    }
  }
}

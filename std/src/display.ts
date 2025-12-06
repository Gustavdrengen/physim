import { clear } from "./draw/shapes.ts";
import { Component, Entity } from "./entity.ts";

export class Display {
  drawComponents: Map<Component<any>, (entity: Entity, data: any) => void> = new Map();

  registerDrawComponent<T>(
    comp: Component<T>,
    drawFunc: (entity: Entity, data: T) => void,
  ) {
    this.drawComponents.set(comp, drawFunc);
  }

  draw() {
    clear();
    for (const [comp, drawFunc] of this.drawComponents) {
      for (const entity of comp.keys()) {
        drawFunc(entity, comp.get(entity));
      }
    }
  }
}

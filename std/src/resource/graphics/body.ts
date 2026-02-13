
import { Vec2 } from "../../base/vec.ts";
import { Display } from "../../base/display.ts";
import { polygon } from "../../base/draw/shapes.ts";
import { Component } from "../../base/entity.ts";
import { Color } from "../../base/draw/color.ts";
import { Body } from "../body/body.ts";

type BodyDisplayData = {
  color: Color;
  fill?: boolean;
  lineWidth?: number;
}

/**
 * Initializes a component that draws bodies.
 *
 * @param display The display to register the component with.
 * @param bodyComponent The body component.
 * @returns The new component.
 *
 * @example
 * ```ts
 * import { Display } from "physim/display";
 * import { Entity } from "physim/ecs";
 * import { Vec2 } from "physim/vec";
 * import { initBodyDisplayComponent } from "physim/graphics";
 * import { initBodyComponent, createRectangle, Body } from "physim/bodies";
 * import { Color } from "physim/draw";
 *
 * const display = new Display();
 * const bodyComponent = initBodyComponent();
 * const bodyDisplay = initBodyDisplayComponent(display, bodyComponent);
 *
 * const myBody = Body.fromShape(createRectangle(50, 50));
 *
 * const entity = Entity.create(
 *   new Vec2(100, 100),
 *   [
 *     [bodyComponent, myBody],
 *     [bodyDisplay, { color: Color.fromRGB(0, 255, 0), fill: true }]
 *   ]
 * );
 * ```
 */
export function initBodyDisplayComponent(
  display: Display,
  bodyComponent: Component<Body>
): Component<BodyDisplayData> {
  const bodyDisplay = new Component<BodyDisplayData>();

  display.registerDrawComponent([bodyDisplay, bodyComponent], (entity, [data, body]) => {
    const { color, fill = true, lineWidth = 1 } = data;
    body.draw(entity.pos, color, fill, lineWidth);
  });

  return bodyDisplay;
}

import { Display } from "../../base/display.ts";
import { Color } from "../../base/draw/color.ts";
import { circle } from "../../base/draw/shapes.ts";
import { Component } from "../../base/entity.ts";

type PointData = {
  color: Color;
  radius: number;
}

/**
 * Initializes a component that draws points.
 *
 * @param display The display to register the component with.
 * @returns The new component.
 *
 * @example
 * ```ts
 * import { Display } from "physim/display";
 * import { Entity } from "physim/ecs";
 * import { Vec2 } from "physim/vec";
 * import { initPointDisplayComponent } from "physim/graphics";
 * import { Color } from "physim/draw";
 *
 * const display = new Display();
 * const pointDisplay = initPointDisplayComponent(display);
 *
 * const player = Entity.create(
 *   new Vec2(0, 0),
 *   [[pointDisplay, { color: Color.fromString("red"), radius: 10 }]]
 * );
 * ```
 */
export function initPointDisplayComponent(
  display: Display,
): Component<PointData> {
  const pointDisplay = new Component<PointData>();

  display.registerDrawComponent(pointDisplay, (entity, data) => {
    circle(entity.pos, data.radius, data.color);
  });

  return pointDisplay;
}

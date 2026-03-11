import { Display } from "../../base/display.ts";
import { Color } from "../../base/draw/color.ts";
import { Draw } from "../../base/draw/shapes.ts";
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
 * import { Display, Entity, Vec2, Color, Draw } from "physim/base";
 * import { initPointDisplayComponent } from "physim/graphics";
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
    Draw.circle(entity.pos, data.radius, data.color);
  });

  return pointDisplay;
}

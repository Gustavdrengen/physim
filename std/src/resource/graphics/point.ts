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
 * import { Display, Entity, Vec2, Graphics } from "physim";
 *
 * const display = new Display();
 * const pointDisplay = Graphics.initPointDisplayComponent(display);
 *
 * const player = new Entity(new Vec2(0, 0));
 * player.addComp(pointDisplay, { color: "red", radius: 10 });
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

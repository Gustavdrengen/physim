
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
 * import { Display, Entity, Vec2 } from "physim";
 * import { Bodies, Graphics, Draw } from "physim";
 *
 * const display = new Display();
 * const bodyDisplay = Graphics.initBodyDisplayComponent(display);
 * const bodyComponent = Bodies.initBodyComponent();
 *
 * const myBody = Bodies.Body.fromShape(Bodies.createRectangle(50, 50));
 *
 * const entity = new Entity(new Vec2(100, 100));
 * entity.addComp(bodyComponent, myBody);
 * entity.addComp(bodyDisplay, { color: Draw.Color.fromRGB(0, 255, 0), fill: true });
 * ```
 */
export function initBodyDisplayComponent(
  display: Display,
  bodyComponent: Component<Body>
): Component<BodyDisplayData> {
  const bodyDisplay = new Component<BodyDisplayData>();

  display.registerDrawComponent([bodyDisplay, bodyComponent], (entity, [data, body]) => {
    const { color, fill, lineWidth = 1 } = data;
    const entityPos = entity.pos;
    // assuming 0 rotation for now
    const entityRotation = 0;

    const transformedVertices: Vec2[] = body.vertices.map((v: Vec2) => {
      const cos = Math.cos(entityRotation);
      const sin = Math.sin(entityRotation);
      const rotatedX = v.x * cos - v.y * sin;
      const rotatedY = v.x * sin + v.y * cos;

      return new Vec2(rotatedX + entityPos.x, rotatedY + entityPos.y);
    });

    polygon(transformedVertices, color, fill, lineWidth);
  });

  return bodyDisplay;
}

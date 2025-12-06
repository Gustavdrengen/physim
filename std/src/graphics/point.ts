import { Display } from "../display.ts";
import { Color } from "../draw/color.ts";
import { circle } from "../draw/shapes.ts";
import { Component } from "../entity.ts";

class PointData {
  color: Color;
  radius: number;

  constructor(color: Color, radius: number) {
    this.color = color;
    this.radius = radius;
  }
}

export function initPointDisplayComponent(display: Display): Component<PointData> {
  const pointDisplay = new Component<PointData>();

  display.registerDrawComponent(pointDisplay, (entity, data) => {
    circle(entity.pos, data.radius, data.color);
  });

  return pointDisplay;
}

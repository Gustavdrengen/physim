import { Component, Display, Draw, Entity, Graphics, Physics, Vec2 } from "physim";

const ent = new Entity(new Vec2(0, 0));
const physics = new Physics();
const display = new Display();
const pointComponent = Graphics.initPointDisplayComponent(display);

ent.addComp(physics.velocity, new Vec2(0.1, 0.3));
ent.addComp(pointComponent, { color: new Draw.Color(250, 50, 100), radius: 5 });

sim.onUpdate = () => {
  physics.update();
  display.draw();
  sim.log("update", ent);
};

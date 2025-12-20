import { Display, Draw, Entity, Graphics, Logging, Physics, Sound, Vec2 } from "physim";
import { initGravityForce } from "../std/src/resource/forces/gravity";

const physics = new Physics();
const display = new Display();
const pointComponent = Graphics.initPointDisplayComponent(display);
initGravityForce(physics, 3)

const ball1 = new Entity(new Vec2(10, 50));
const ball2 = new Entity(new Vec2(100, 100));

ball1.addComp(physics.mass, 10);
ball1.addComp(pointComponent, { color: new Draw.Color(250, 50, 100), radius: 5 });

ball2.addComp(physics.mass, 10);
ball2.addComp(pointComponent, { color: new Draw.Color(20, 250, 100), radius: 5 });

Logging.log("Starting simulation...");

sim.onUpdate = () => {
  physics.update();
  display.draw();

  if (sim.frame == 60 * 5) {
    sim.finish();
  }
};

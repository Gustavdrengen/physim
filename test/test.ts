import { Camera, Display, Draw, Entity, Graphics, Logging, Physics, Vec2 } from "physim";
import { initGravityForce } from "../std/src/resource/forces/gravity";

const camera = new Camera();
camera.zoom = 2;
const physics = new Physics();
const display = new Display();
const pointComponent = Graphics.initPointDisplayComponent(display);
initGravityForce(physics, 3)

const ball1 = new Entity(new Vec2(10, 50));
const ball2 = new Entity(new Vec2(100, 100));
const ball3 = new Entity(new Vec2(130, 200));

ball1.addComp(physics.mass, 10);
ball1.addComp(pointComponent, { color: new Draw.Color(250, 50, 100), radius: 5 });

ball2.addComp(physics.mass, 10);
ball2.addComp(pointComponent, { color: new Draw.Color(20, 250, 100), radius: 5 });

ball3.addComp(physics.mass, 10);
ball3.addComp(pointComponent, { color: new Draw.Color(20, 50, 250), radius: 5 });

camera.follow([ball1, ball2, ball3])

Logging.log("Starting simulation...");

sim.onUpdate = () => {
  physics.update();
  display.draw(camera);

  if (sim.frame == 60 * 5) {
    sim.finish();
  }
};

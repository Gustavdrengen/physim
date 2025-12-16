import { Display, Draw, Entity, Graphics, Logging, Physics, Sound, Vec2 } from "physim";

const ent = new Entity(new Vec2(0, 0));
const physics = new Physics();
const display = new Display();
const pointComponent = Graphics.initPointDisplayComponent(display);

ent.addComp(physics.velocity, new Vec2(0.1, 0.3));
ent.addComp(pointComponent, { color: new Draw.Color(250, 50, 100), radius: 5 });

Logging.log("Starting simulation...");

await sim.addFetchAsset("sfx.mp3", "https://www.myinstants.com/media/sounds/rizz-sound-effect.mp3")

const sound = await Sound.fromSrc("sfx.mp3");

sim.onUpdate = () => {
  physics.update();
  display.draw();

  if (sim.frame % 60 == 0) {
    sound.play();
  }
  if (sim.frame == 60 * 5) {
    sim.finish();
  }
};

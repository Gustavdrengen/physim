import { Camera } from "./camera.ts";
import { Display } from "./display.ts";
import { Physics } from "./physics.ts";

export class Simulation {
  physics = new Physics();
  display = new Display();
  camera = new Camera();

  constructor() { }

  run(onUpdate: () => void = () => {}) {
    sim.onUpdate = () => {
      this.physics.update();
      this.display.draw(this.camera);
      onUpdate();
    };
  }
}

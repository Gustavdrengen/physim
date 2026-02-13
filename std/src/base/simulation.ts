import { Camera } from "./camera.ts";
import { Display } from "./display.ts";
import { Physics } from "./physics.ts";

/**
 * The `Simulation` class is the main entry point for creating and managing a simulation.
 * It integrates a `Physics` instance for handling physics calculations and a `Display` instance for rendering.
 */
export class Simulation {
  /**
   * The physics engine instance used by this simulation.
   */
  physics = new Physics();
  /**
   * The display manager instance used by this simulation for rendering.
   */
  display = new Display();
  /**
   * The camera instance used to control the view of the simulation.
   */
  camera = new Camera();

  /**
   * Creates a new Simulation instance.
   */
  constructor() { }

  /**
   * Runs the simulation loop.
   * This method sets up a continuous update cycle that calls the provided `onUpdate` callback
   * on each frame, after physics updates and display rendering.
   *
   * @param onUpdate An optional callback function to be executed on each frame.
   */
  run(onUpdate: () => void = () => { }) {
    sim.onUpdate = () => {
      this.physics.update();
      this.display.draw(this.camera);
      onUpdate();
    };
  }
}

import { Camera } from "./camera.ts";
import { Display } from "./display.ts";
import { Physics } from "./physics.ts";

/**
 * The `Simulation` class is the main entry point for creating and managing a simulation.
 * It integrates physics calculations and display rendering into a single cohesive API.
 *
 * @example
 * ```ts
 * import { Simulation, Entity, Vec2, Color } from "physim/base";
 * import { Body, createRectangle, initBodyComponent } from "physim/bodies";
 * import { initBodyDisplayComponent } from "physim/graphics";
 *
 * const sim = new Simulation();
 *
 * // Initialize components for bodies and their display
 * const bodyComp = initBodyComponent(sim.physics);
 * const displayComp = initBodyDisplayComponent(sim.display, bodyComp);
 *
 * // Create a falling rectangle
 * Entity.create(
 *   new Vec2(100, 100),
 *   [
 *     [sim.physics.velocity, new Vec2(0, 50)],
 *     [bodyComp, Body.fromShape(createRectangle(20, 20))],
 *     [displayComp, { color: Color.fromString("orange") }]
 *   ]
 * );
 *
 * // Run the simulation loop
 * await sim.run();
 * ```
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
   * The current frame number of the simulation.
   */
  frame = 0;
  private autoStopTime?: number;

  /**
   * The current simulation time in seconds.
   */
  get time(): number {
    return this.frame / 60;
  }

  /**
   * Creates a new Simulation instance.
   * @param autoStopTime The number of seconds after which the simulation should automatically stop.
   */
  constructor(autoStopTime?: number) {
    this.autoStopTime = autoStopTime;
  }

  /**
   * Runs the simulation loop.
   * Sets up a continuous update cycle at 60 fps that calls the provided
   * `onUpdate` callback on each frame, after physics updates and display rendering.
   *
   * This function resolves when the simulation is finished.
   *
   * @param onUpdate An optional callback function to be executed on each frame.
   * @returns A promise that resolves when the simulation finishes.
   */
  // @profile "Simulation.run"
  async run(onUpdate: () => void = () => { }): Promise<void> {
    await sim.run(() => {
      this.frame++;
      if (this.autoStopTime && this.time >= this.autoStopTime) {
        this.finish();
        return;
      }

      // @profile-start "Simulation.physics.update"
      this.physics.update();
      // @profile-end

      // @profile-start "Simulation.display.draw"
      this.display.draw(this.camera);
      // @profile-end

      // @profile-start "Simulation.onUpdate"
      onUpdate();
      // @profile-end
    });
  }

  /**
   * Stops the simulation.
   */
  finish(): void {
    sim.finish();
  }
}

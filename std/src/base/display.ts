import { Camera } from "./camera.ts";
import { clear } from "./draw/shapes.ts";
import { Component, Entity } from "./entity.ts";
import { Vec2 } from "./vec.ts";

/**
 * The `Display` class is responsible for drawing entities on the canvas.
 *
 * @example
 * ```ts
 * import { Simulation } from "physim/simulation";
 * import { Entity } from "physim/ecs";
 * import { Vec2 } from "physim/vec";
 * import { circle } from "physim/draw";
 *
 * const simulation = new Simulation();
 *
 * // Use the physics velocity component for drawing
 * simulation.display.registerDrawComponent(simulation.physics.velocity, (entity, vel) => {
 *   // Custom drawing logic for entities with a velocity component
 *   // For example, draw a circle at the entity's position, and a line indicating velocity
 *   circle(entity.pos, 10, "blue", true);
 *   // line(entity.pos, entity.pos.add(vel), "red", 2);
 * });
 *
 * // Create an entity with a velocity component
 * const myEntity = Entity.create(
 *   new Vec2(50, 50),
 *   [[simulation.physics.velocity, new Vec2(10, 10)]]
 * );
 *
 * // Run the simulation
 * simulation.run();
 * ```
 */
export class Display {
  private drawComponents: Map<
    Component<any>[] | Component<any>,
    (entity: Entity, data: any) => void
  > = new Map();

  /**
   * Registers a draw function for a component or multiple components.
   *
   * @param comps The component or array of components to register.
   * @param drawFunc The function to call to draw the component(s).
   */
  registerDrawComponent<T extends any[]>(
    comps: Component<T[number]>[],
    drawFunc: (entity: Entity, data: T) => void,
  ): void;
  /**
   * Registers a draw function for a single component.
   * @param comp The component to register.
   * @param drawFunc The function to call to draw the component.
   */
  registerDrawComponent<T>(
    comp: Component<T>,
    drawFunc: (entity: Entity, data: T) => void,
  ): void;
  registerDrawComponent<T>(
    comps: Component<T>[] | Component<T>,
    drawFunc: (entity: Entity, data: T | T[]) => void,
  ) {
    this.drawComponents.set(comps, drawFunc);
  }

  /**
   * Clears the screen and draws all registered components.
   * @param camera The camera to use for rendering. If not provided, a default camera is used.
   */
  draw(camera?: Camera) {
    const effectiveCamera = camera ?? new Camera();

    if (effectiveCamera.target) {
      if (Array.isArray(effectiveCamera.target)) {
        const positions = effectiveCamera.target.map((e) => e.pos);
        effectiveCamera.position = Vec2.average(positions);
      } else {
        effectiveCamera.position = effectiveCamera.target.pos;
      }
    }

    clear();
    sim.ctx.save(); // Save the context before applying camera transforms
    effectiveCamera._applyTransforms(sim.ctx);

    for (const [comps, drawFunc] of this.drawComponents) {
      const componentsArray = Array.isArray(comps) ? comps : [comps];

      // Find entities that have all required components
      let entitiesWithAllComps: Set<Entity> | undefined;

      for (const comp of componentsArray) {
        if (!entitiesWithAllComps) {
          entitiesWithAllComps = new Set(comp.keys());
        } else {
          entitiesWithAllComps = new Set(
            [...entitiesWithAllComps].filter((entity) => comp.has(entity)),
          );
        }
      }

      if (entitiesWithAllComps) {
        for (const entity of entitiesWithAllComps) {
          const data =
            componentsArray.length === 1
              ? componentsArray[0].get(entity)
              : componentsArray.map((c) => c.get(entity));
          drawFunc(entity, data);
        }
      }
    }

    effectiveCamera._removeTransforms(sim.ctx);
    sim.ctx.restore(); // Restore the context after drawing
  }
}

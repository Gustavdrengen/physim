import { Component, Entity } from "./entity.ts";
import { Vec2 } from "./vec.ts";

/**
 * The `Physics` class is responsible for updating entities based on forces.
 * It applies forces like velocity and acceleration to entities that possess
 * the relevant components.
 *
 * @example
 * ```ts
 * import { Simulation, Entity, Vec2, Color } from "physim/base";
 * import { Body, createCircle, initBodyComponent } from "physim/bodies";
 * import { initBodyDisplayComponent } from "physim/graphics";
 *
 * const sim = new Simulation();
 *
 * // Apply gravity to everything in the simulation
 * sim.physics.constantPull = new Vec2(0, 20);
 *
 * // Initialize components
 * const bodyComp = initBodyComponent(sim.physics);
 * const displayComp = initBodyDisplayComponent(sim.display, bodyComp);
 *
 * // Create a ball that will fall
 * Entity.create(
 *   new Vec2(100, 100),
 *   [
 *     [sim.physics.velocity, new Vec2(200, 0)],
 *     [bodyComp, Body.fromShape(createCircle(10))],
 *     [displayComp, { color: Color.fromString("blue") }]
 *   ]
 * );
 *
 * await sim.run();
 * ```
 */
export class Physics {
  private forces: Array<
    [
      comps: Component<any>[] | Component<any>,
      force: (entity: Entity, data: any) => void,
      priority: number,
    ]
  > = [];
  private staticForces: Array<
    [
      force: () => void,
      priority: number,
    ]
  > = [];
  private forcesSorted = true;

  /**
   * The velocity component.
   * Velocity is expressed in units per second.
   * If an entity has this component, it will be moved by its velocity every second.
   */
  velocity: Component<Vec2> = new Component<Vec2>();
  /**
   * The acceleration component.
   * This component is used to accumulate forces on an entity.
   * Acceleration is expressed in units per second squared.
   */
  acceleration: Component<Vec2> = new Component<Vec2>();

  // TODO: Figure out if this should actually be in the base layer
  /**
   * The mass component.
   * This component is used to store the mass of an entity.
   */
  mass: Component<number> = new Component<number>();

  /**
   * Constant directional pull (gravity) applied to all entities with a velocity component.
   * This effectively acts as a uniform acceleration field.
   */
  constantPull: Vec2 = new Vec2(0, 0);

  /**
   * Creates a new `Physics` instance.
   */
  constructor() {
    this.registerForce(
      this.velocity,
      (entity: Entity, vel: Vec2): void => {
        const velWithPull = vel.add(this.constantPull);
        this.velocity.set(entity, velWithPull);
      },
      3,
    );

    this.registerForce(
      this.acceleration,
      (entity: Entity, acc: Vec2): void => {
        const vel = this.velocity.get(entity) || new Vec2(0, 0);
        this.velocity.set(entity, vel.add(acc));
        this.acceleration.set(entity, new Vec2(0, 0));
      },
      1,
    );

    this.registerForce(
      this.velocity,
      (entity: Entity, vel: Vec2): void => {
        entity.pos = entity.pos.add(vel.scale(1 / 60));
      },
      2,
    );
  }

  /**
   * Registers a force to be applied to entities.
   * @param comp The component that the force is associated with.
   * @param force The function that applies the force.
   * @param priority The priority of the force.
   */
  registerForce<T>(
    comp: Component<T>,
    force: (entity: Entity, data: T) => void,
    priority?: number,
  ): void;
  registerForce<T>(
    comps: Component<T>[] | Component<T>,
    force: (entity: Entity, data: T | T[]) => void,
    priority = 0,
  ): void {
    this.forces.push([comps, force, priority]);
    this.forcesSorted = false;
  }

  /**
   * Registers a static force that runs once per frame.
   * @param force The function to call once per frame.
   * @param priority The priority of the force.
   */
  registerStaticForce(
    force: () => void,
    priority = 0,
  ): void {
    this.staticForces.push([force, priority]);
    this.forcesSorted = false;
  }

  /**
   * Updates the position of all entities based on the registered forces.
   */
  // @profile "Physics.update"
  update(): void {
    if (!this.forcesSorted) {
      this.forces.sort((a, b) => a[2] - b[2]);
      this.staticForces.sort((a, b) => a[1] - b[1]);
      this.forcesSorted = true;
    }

    // @profile-start "Physics.update.forceLoop"
    let forceIndex = 0;
    let staticIndex = 0;

    while (forceIndex < this.forces.length || staticIndex < this.staticForces.length) {
      const forcePriority = forceIndex < this.forces.length
        ? this.forces[forceIndex]?.[2] ?? Infinity
        : Infinity;
      const staticPriority = staticIndex < this.staticForces.length
        ? this.staticForces[staticIndex]?.[1] ?? Infinity
        : Infinity;

      if (forcePriority <= staticPriority && forceIndex < this.forces.length) {
        const [comps, forceFunc] = this.forces[forceIndex]!;
        forceIndex++;

        const componentsArray = Array.isArray(comps) ? comps : [comps];

        if (componentsArray.length === 1) {
          const comp = componentsArray[0];
          for (const [entity, data] of comp) {
            forceFunc(entity, data);
          }
        } else {
          let smallestComp = componentsArray[0];
          for (let i = 1; i < componentsArray.length; i++) {
            if (componentsArray[i].size < smallestComp.size) {
              smallestComp = componentsArray[i];
            }
          }

          for (const [entity, data] of smallestComp) {
            let hasAll = true;
            for (const comp of componentsArray) {
              if (comp === smallestComp) continue;
              if (!comp.has(entity)) {
                hasAll = false;
                break;
              }
            }

            if (hasAll) {
              const allData = componentsArray.map((c) =>
                c === smallestComp ? data : c.get(entity),
              );
              forceFunc(entity, allData);
            }
          }
        }
      } else if (staticIndex < this.staticForces.length) {
        const [forceFn] = this.staticForces[staticIndex]!;
        staticIndex++;
        forceFn();
      }
    }
    // @profile-end
  }
}

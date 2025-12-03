/*
   Standard Library Module
   Here is a structure of how the standard library is organized (items with % are unimplemented):

    Layer 1:                                  Fundemental things
      Fundemental IO:
        - *Draw*                                  Basic drawing operations
          -- Many drawing functions --
        % *Audio*                                 Basic audio operations
          -- Many audio functions --
      Basic Math and Data Structures:
        - Vec2                                    A 2D vector class with common vector operations
        - Entity                                  Entity class for managing components only includes position
        - Component                               Component class for entity-component system
      Basic physics system:
        - Physics                                 Generic physics system intended to be extended by other modules
      Basic display System:
        - Display                                  A basic display system to manage rendering entities to the screen

    Laver 2:                                  Builds on Layer 1 to provide specified things and helpers
        % *Forces*                                Physics forces like gravity, drag, collisions, etc.
        - *Graphics*                              Display components using Display

    Layer 3:                                  Builds on Layer 2 to provide complete helper systems for the user
        - Logging                                 A logging system to log data during simulations using sim.log
        % Simulation                              A helper class designed to make it as easy as possible to create full simulations
 */

export * from "./vec.ts";
export * as Draw from "./draw/mod.ts";
export * from "./entity.ts";
export * from "./physics.ts";
export * from "./display.ts";
export * as Graphics from "./graphics/mod.ts";
export * as Logging from "./logging/mod.ts";

# The Structure of the Standard Library
Here is the structure of how the standard library is organized (bold means module, italics means unimplemented):

## Base layer:                               Generic things

Fundemental IO:
 - **Draw**                                  Basic drawing operations
   - Color 
   -- Many drawing functions --
 - SoundBuilder                            Basic sound builder
 - Sound                                   Sound id wrapper
Basic Math and Data Structures:
 - Vec2                                    A 2D vector class with common vector operations
 - Entity                                  Entity class for managing components only includes position
 - Component                               Component class for entity-component system
Basic physics system:
 - Physics                                 Generic physics system intended to be extended by other modules
Basic display System:
 - Display                                  A basic display system to manage rendering entities to the screen

## Resource layer:                           Builds on Layer 1 to provide specified things

 - ***Forces***                                Physics forces like gravity, drag, collisions, etc.
 - **Graphics**                              Display components using Display

## Helper layer:                             Builds on Layer 2 to provide complete helper systems for the user

 - **Logging**                              A logging system to log data during simulations using sim.log
 - *Simulation*                             A helper class designed to make it as easy as possible to create full simulations

# The Structure of the Standard Library

Here is the structure of how the standard library is organized containing all import paths (italics means unimplemented):
The library is split into three layers: the base layer, the resource layer and the helper layer.
Code must not depend on code from layers above themself.
All modules (especially outside the base layer) should be completely tree-shakable, allowing the library to grow without adding bloat to the compiled code.

## Base layer

_Generic things, that may be used in all simulations, and that lay the foundation for more specified features.
It is totally allowed to contain advanced features, as long as they are still generic.
This layer is not allowed to be feature-discriminating. An example of that would be providing a way to generate sound from one instrument but not from others.
In this example the only way for a sound-generation feature to be added would be to give complete control over sound generation. Intrument presets could then be added in the resource layer._

| Name              | Description                                                                      |
| ----------------- | -------------------------------------------------------------------------------- |
| physim/draw       | Basic drawing operations                                                         |
| physim/audio      | Basic audio system                                                               |
| physim/vec        | A 2D vector class with common vector operations                                  |
| physim/ecs        | Entity and Component class for managing components, includes only position       |
| physim/physics    | Generic physics system intended to be extended by other modules                  |
| physim/display    | A basic display system to manage rendering entities to the screen, with a camera |
| physim/particles  | A system for creating and managing particles                                     |
| physim/simulation | A system for managing the simulation                                             |

## Resource layer

_Builds on Layer 1 to provide more specified things_

| Name                     | Description                                                                    |
| ------------------------ | ------------------------------------------------------------------------------ |
| physim/forces/gravity    | Gravity force                                                                  |
| physim/forces/collision  | Collision force                                                                |
| physim/graphics          | Display components using Display                                               |
| physim/bodies            | A system for defining the physical body of an entity for physics and graphics. |
| physim/effects/particles | Provides pre-configured particle effects like fire and rain                    |

## Helper layer

_Helps with development by doing things like logging and debugging_

| Name           | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| physim/logging | A logging system to log data during simulations using sim.log |

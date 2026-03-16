# The Structure of the Standard Library

Here is the structure of how the standard library is organized containing all import paths:
The library is split into four layers: the base layer, the feature layer, the resource layer and the helper layer.
Code must not depend on code from layers above themself.
All modules (especially outside the base layer) should be completely tree-shakable, allowing the library to grow without adding bloat to the compiled code.

## Base layer

_Generic things, that may be used in all simulations, and that lay the foundation for more specified features.
It should only contain generic, fundemental things.
This layer is not allowed to be feature-discriminating. An example of that would be providing a way to generate sound from one instrument but not from others.
In this example the only way for a sound-generation feature to be added would be to give complete control over sound generation. Intrument presets could then be added in the resource layer._

| Name       | Description                                                                      |
| ---------- | -------------------------------------------------------------------------------- |
| draw       | Basic drawing operations                                                         |
| audio      | Basic audio system                                                               |
| vec        | A 2D vector class with common vector operations                                  |
| ecs        | Entity and Component class for managing components, includes only position       |
| physics    | Generic physics system intended to be extended by other modules                  |
| display    | A basic display system to manage rendering entities to the screen, with a camera |
| assets     | Utilities for handling and fetching assets                                       |
| simulation | A system for managing the simulation                                             |

## Feature layer

_Just like the base layer, it is not allowed to be feature-discriminating, features should be generic.
But this layer should contain should contain more advanced features, that might not be usable in every simulation_

| Name             | Description                                                                    |
| ---------------- | ------------------------------------------------------------------------------ |
| physim/particles | A system for creating and managing particles                                   |
| physim/bodies    | A system for defining the physical body of an entity for physics and graphics. |
| physim/graphics  | Display components and statics using Display                                   |

## Resource layer

_Provides more specific, un-generic and discriminating things_

| Name                     | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| physim/forces/gravity    | Gravity force                                               |
| physim/forces/collision  | Collision force                                             |
| physim/effects/particles | Provides pre-configured particle effects like fire and rain |
| physim/sounds            | A library of sound effects and instruments                  |

## Helper layer

_Helps with development by doing things like logging and debugging_

| Name           | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| physim/logging | A logging system to log data during simulations using sim.log |

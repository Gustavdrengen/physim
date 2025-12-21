# The Structure of the Standard Library
Here is the structure of how the standard library is organized containing all modules and classes (bold means module, italics means unimplemented):
The library is split into three layers: the base layer, the resource layer and the helper layer.
All modules (especially outside the base layer) should be completely tree-shakable, allowing the library to grow without adding bloat to the compiled code.

## Base layer
*Generic things, that may be used in all simulations, and that lay the foundation for more specified features. It is totally allowed to contain advanced features, as long as they are still generic.*

Fundemental IO:
| Name                  | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| **Draw**              | Basic drawing operations                                                            |
| Draw.Color            | Color type                                                                          |
| SoundBuilder          | Basic sound type                                                                    |
| Sound                 | Sound id wrapper                                                                    |

Basic Math and Data Structures:
| Name                  | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| Vec2                  | A 2D vector class with common vector operations                                     |
| Entity                | Entity class for managing components only includes position                         |
| Component             | Component class for entity-component system                                         |

Basic physics system:
| Name                  | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| Physics               | Generic physics system intended to be extended by other modules                     |

Basic display System:
| Name                  | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| Display               | A basic display system to manage rendering entities to the screen                   |
| Camera                | A camera for controlling the view of the simulation                                 |

## Resource layer
*Builds on Layer 1 to provide more specified things*

| Name                  | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| **Forces**            | Physics forces like gravity, drag, collisions, etc.                                 |
| **Graphics**          | Display components using Display                                                    |
| **Bodies**            | A system for defining the physical shape of an entity for physics and graphics.     |

## Helper layer
*Builds on Layer 2 to provide complete helper systems for the user*

| Name                  | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| **Logging**           | A logging system to log data during simulations using sim.log                       |
| *Simulation*          | A helper class designed to make it as easy as possible to create full simulations   |

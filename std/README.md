# Physim Standard Library

Physim is a TypeScript library designed for creating physics simulations and interactive visualizations. It provides a modular and extensible framework based on an Entity-Component-System (ECS) architecture, along with utilities for 2D vector math, drawing, display management, physics, and more.

## How to Use

You can import components like this:

```typescript
import { Vec2 } from "physim/vec";
import { Entity, Component } from "physim/ecs";
// ... and so on for other modules
```

## Core Concepts

- **Entity-Component-System (ECS)**: Physim uses an ECS architecture where `Entity` objects are simple containers for `Component` data. Components store specific data (e.g., position, velocity, mass), and systems (like `Physics` or `Display`) operate on entities that possess the relevant components.
- **Vec2**: A fundamental 2D vector class for all positional and directional calculations.
- **Display & Camera**: Manages rendering entities to a canvas, with a `Camera` for controlling the view.
- **Physics**: A system for applying forces and updating entity states based on physical properties.

## Example: Simple Gravity Simulation

This example demonstrates how to set up a basic simulation with gravity, displaying two bodies attracting each other.

```typescript
import { Display, Camera } from "physim/display";
import { Entity, Component } from "physim/ecs";
import { Vec2 } from "physim/vec";
import { Physics } from "physim/physics";
import { initGravityForce } from "physim/forces";
import { initBodyComponent, createCircle, Body } from "physim/bodies";
import { initBodyDisplayComponent } from "physim/graphics";
import { Color } from "physim/draw";

// 1. Initialize core systems
const display = new Display();
const camera = new Camera();
const physics = new Physics();

// 2. Initialize components
const bodyComponent = initBodyComponent();
const bodyDisplay = initBodyDisplayComponent(display, bodyComponent);

// 3. Configure physics forces
initGravityForce(physics, 50); // Adjust G for stronger/weaker gravity

// 4. Create entities
const planet1 = new Entity(new Vec2(200, 200));
planet1.addComp(physics.mass, 1000);
planet1.addComp(bodyComponent, Body.fromShape(createCircle(20)));
planet1.addComp(bodyDisplay, { color: Color.fromString("blue"), fill: true });

const planet2 = new Entity(new Vec2(400, 200));
planet2.addComp(physics.mass, 100);
planet2.addComp(physics.velocity, new Vec2(0, 2)); // Give it an initial velocity
planet2.addComp(bodyComponent, Body.fromShape(createCircle(10)));
planet2.addComp(bodyDisplay, { color: Color.fromString("red"), fill: true });

sim.onUpdate = () => {
  physics.update(); // Update all physics
  display.draw(camera); // Draw all entities
};
```

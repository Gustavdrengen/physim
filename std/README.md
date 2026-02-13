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
import { Simulation } from "physim/simulation";
import { Entity } from "physim/ecs";
import { Vec2 } from "physim/vec";
import { initGravityForce } from "physim/forces/gravity";
import { initBodyComponent, createCircle, Body } from "physim/bodies";
import { initBodyDisplayComponent } from "physim/graphics";
import { Color } from "physim/draw";

// 1. Initialize core simulation
const simulation = new Simulation();

// 2. Initialize components and forces
const bodyComponent = initBodyComponent();
const bodyDisplayComponent = initBodyDisplayComponent(simulation.display, bodyComponent); // Register body drawing
initGravityForce(simulation.physics, 50); // Adjust G for stronger/weaker gravity

// 3. Create entities
const objectA = Entity.create(
  new Vec2(200, 200),
  [
    [simulation.physics.mass, 1000],
    [bodyComponent, Body.fromShape(createCircle(20))],
    [simulation.physics.velocity, Vec2.zero()], // Initialize velocity
    [simulation.physics.acceleration, Vec2.zero()], // Initialize acceleration
    [bodyDisplayComponent, { color: Color.fromString("blue"), fill: true }]
  ]
);

const objectB = Entity.create(
  new Vec2(400, 200),
  [
    [simulation.physics.mass, 100],
    [bodyComponent, Body.fromShape(createCircle(10))],
    [simulation.physics.velocity, new Vec2(0, 2)], // Give it an initial velocity
    [simulation.physics.acceleration, Vec2.zero()], // Initialize acceleration
    [bodyDisplayComponent, { color: Color.fromString("red"), fill: true }]
  ]
);

// 4. Run the simulation
simulation.run();
```

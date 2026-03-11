# Physim

Physim is a 2D physics simulation, visualization, and audiation framework for TypeScript. It's designed to be simple to use while providing full control over the simulation environment, allowing for non-traditional physics and interactions.

## Features

- **2D Physics:** Physics engine with support for complex shapes and constraints.
- **Visualization:** Integrated 2D rendering engine for real-time visualization.
- **Audiation:** Built-in support for generating sounds based on simulation events.
- **TypeScript First:** Developed with TypeScript for a robust and type-safe development experience.
- **Extensible:** Easily define custom forces, behaviors, and interactions.

## Installation

### Prerequisites

- **Deno:** Required to run the CLI and simulations. [Install Deno](https://deno.land/#install).
- **Rust/Cargo:** Required to build the core physics engine. [Install Rust](https://rustup.rs/).

### Steps

1. Clone the repository to the installation location:

   ```bash
   git clone https://github.com/gustavdrengen/physim.git
   cd physim
   ```

2. Run the installation script (requires `sudo` to add the `physim` command to your path):
   ```bash
   ./install/linux.sh
   ```

## Getting Started

1. **Initialize your project:**
   Create a new directory for your simulation and run `physim init`. This will generate a `tsconfig.json` file with the correct path mappings for `physim/*` imports.

   ```bash
   mkdir my-sim && cd my-sim
   physim init
   ```

2. **Create a simulation:**
   Create a file named `main.ts` with the following content:

   ```typescript
   import { Simulation } from "physim/simulation";
   import { Vec2 } from "physim/vec";
   import { Body, createCircle, initBodyComponent } from "physim/bodies";
   import { initBodyDisplayComponent } from "physim/graphics";
   import { Color } from "physim/draw";
   import { Entity } from "physim/ecs";

   const simulation = new Simulation();

   // Initialize components
   const bodyComponent = initBodyComponent();
   const bodyDisplayComponent = initBodyDisplayComponent(
     simulation.display,
     bodyComponent,
   );

   // Create a ball
   Entity.create(new Vec2(250, 250), [
     [bodyComponent, Body.fromShape(createCircle(30))],
     [bodyDisplayComponent, { color: Color.fromString("blue"), fill: true }],
   ]);

   // Run the simulation
   await simulation.run();
   ```

3. **Run it:**
   ```bash
   physim run main.ts
   ```

## CLI Usage

The `physim` command provides several utilities:

- `physim run <file>`: Bundles and runs a simulation.
  - `--webview`: Opens the simulation in a standalone window.
  - `--record <outfile.mp4>`: Records the simulation to a video file.
  - `--no-audio`: Disables audio playback.
- `physim init`: Sets up a `tsconfig.json` for local development.
- `physim docs`: Generates documentation for the library.
- `physim deps`: Manages system dependencies.

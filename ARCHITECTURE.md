# Project Architecture

Physim is a framework for physics simulation, visualization, and audiation. It integrates a TypeScript-based simulation environment with a Deno-powered CLI.

## System Components

### 1. The CLI (`core/`)

The CLI is the orchestrator of the system, built on **Deno**. Its primary responsibilities include:

- **Project Lifecycle:** Initializing new projects (`init`) and managing system dependencies (`deps`).
- **Bundling:** Using `esbuild` to compile user simulation scripts and the standard library into a single executable bundle.
- **Runtime Hosting:** Running an internal HTTP server that serves the simulation environment and handles requests from the running simulation.
- **Recording:** Interfacing with `ffmpeg` to encode canvas frames into MP4 video.

### 2. The Simulation Runtime (`core/sim.html` & `sim.js`)

Simulations do not run directly in Deno; they run in a **Browser** or **Webview** environment.

- **Sandbox:** User code is executed inside a secure iframe.
- **The `sim` Bridge:** A global `sim` object is injected into the sandbox, providing APIs for logging, rendering (via a 2D Canvas context), and triggering sounds.
- **Communication:** The runtime communicates with the CLI server over HTTP (e.g., POSTing logs, frame data, and sound triggers).

### 3. The Standard Library (`std/`)

A modular TypeScript library that users import to build their simulations.

- It provides the high-level abstractions (Entities, Components, Physics, Graphics) that consume the low-level `sim` bridge.
- _Note: For details on the internal layering system of the library, see [std/STRUCTURE.md](std/STRUCTURE.md)._

### 4. Native Audio Core (`rust-core/`)

A **Rust** dynamic library used to bypass the limitations of web-based audio for real-time audiation.

- **FFI:** The CLI calls into this library via Deno's Foreign Function Interface.
- **Low-Latency Playback:** Uses native audio APIs to ensure sounds triggered by simulation events are played with minimal delay.

## Execution Flow

1. **Bundle:** `physim run` bundles the user script + `std/`.
2. **Serve:** CLI starts a server and opens the browser/webview to `sim.html`.
3. **Execute:** `sim.js` fetches the bundle and executes it within the sandbox.
4. **Interact:** The simulation sends frames (for recording), logs, and sound IDs back to the CLI server via HTTP.
5. **Audiate:** The CLI receives sound requests and forwards them to the Rust core for native playback.

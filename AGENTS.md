# Instructions for AI Agents

Welcome to the **physim** project. This file provides guidance for AI agents working on this codebase.

## Project Summary

Physim is a framework for physics simulation, visualization, and audiation. It consists of:

- **CLI (`core/`)** - Deno-based orchestrator for project lifecycle, bundling, and runtime hosting
- **Simulation Runtime** - Browser/webview environment for executing user simulations
- **Native Audio Core (`rust-core/`)** - Rust library for low-latency audio playback

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview and component design
- [GOALS.md](./GOALS.md) - Project goals and vision

For the `std/` directory, see [std/AGENTS.md](./std/AGENTS.md) and related documentation in that folder.

## Protocol for Implementing Features

These are the steps for implementing a feature:

1.  **Discovery** - Read ARCHITECTURE.md for system context and identify relevant components
2.  **Plan** - Propose an implementation plan describing what files will be changed/created and why. Do NOT implement anything yet.
3.  **Review** - Wait for the user to accept or revise the plan
4.  **Implement** - Once approved, implement the feature. Ask if any questions or blockers arise during implementation

## Tasks

# Library Style Guidelines

## 1. Code Comments

- Minimize inline and block comments.
- Only comment non-obvious logic or workarounds.

## 2. Documentation

- All exported/public entities must have TSDoc comments.
- Internal/private entities should not have TSDoc comments, with the exception of the `/** @internal */` tag.
- Documentation should never contain implementation details or any information about what the function does internally.
- Documentation should describe all the behavior of the function fully, even if concisely.

### Documentation Priority

- If a piece of documentation or an example applies to the **overall purpose** of a module (file), it MUST be placed at the **module level** (using the `@module` tag).
- Entity-level documentation (class/function) is reserved for details **specific** to that entity.
- **Priority**: Module-level takes priority for "primary use case" examples to avoid duplication. Do not repeat module-level examples on individual entities within that module.

### Examples

- Example code should be executable, but does not have to be a full demo.
- Examples should always make sense in a real use case and use the recommended way to do something.
- They should have comments explaining non-obvious code.
- **Imports**: Examples **should** use public API import paths (e.g., `import { ... } from "physim/base"`) to demonstrate real-world usage.
- **When to include examples**:
  - **Primary API Classes**: The main classes users interact with (e.g., `Simulation`, `Entity`, `Body`).
  - **Main Behavior Coverage**: Examples should collectively ensure that all the main behavior of every module is documented and demonstrated, often done by a module-level example.
  - **Complex Interactions**: Examples that show how multiple components work together.
  - **Non-obvious Functions**: Functions with side effects, complex parameters, or static factory methods (e.g., `Vec2.average`).

#### Guidelines for example code

Always prefer simpler ways of doing things. Examples include:
- Using the `Simulation` class over `Physics` and `Display` separately.
- Using `Entity.create` over `new Entity` followed by `Entity.addComp`.

## 3. Code Style

- 2 space indentation.
- Arrow functions preferred for small functions.
- camelCase for variables/functions, PascalCase for classes/types.
- Keep lines ≤ 100 characters.

## 4. Imports & Exports

- **Internal Code**: Don't import from the public API (e.g., `src/public/...`). Use relative internal paths.
- Organize imports: external packages first, internal modules after.

## 5. Type Annotations

- Always annotate parameters and return types of both public and internal functions.
- This includes explicit `: void` for functions that do not return a value.

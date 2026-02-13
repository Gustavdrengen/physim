# Library Style Guidelines

## 1. Code Comments

- Minimize inline and block comments.
- Only comment non-obvious logic or workarounds.

## 2. Documentation

- All exported/public entities must have TSDoc comments.
- Internal/private entities should not have TSDoc comments.
- If a piece of documentation could make sence both on a module level, and a function/class level, put it on the module level.
- Documentation should never contain implementation details or any information about what the function does internally.
- Documentation should describe all the behaviour of the function. It does does not have to be detailed, but it shuold still cover fully.

### Documentation examples

- Example code should be executable, but does not have to be a full demo.
- Examples should always make sense in a real use case and use the recomended way to do something.
- They should have comments explaining non-obvious code.

#### Recomendations

This is a list of recomendations examples should follow:

- Always prefer simpler ways of doing thins. Exampels include:
  - Using the `Simulation` class over `Physics` and `Display` separately.
  - Using `Entity.create` over `new Entity` followed by `Entity.addComp`.

## 3. Code Style

- 2 space indentaton.
- Arrow functions preferred for small functions.
- camelCase for variables/functions, PascalCase for classes/types.
- Keep lines ≤ 100 characters.

## 4. Imports & Exports

- Dont import from the public API.
- Organize imports: external packages first, internal modules after.

## 5. Type Annotations

- Always annotate parameters and return types of both public and internal functions.

# Library Style Guidelines

## 1. Code Comments
- Minimize inline and block comments.
- Only comment non-obvious logic or workarounds.

## 2. Documentation
- All exported/public entities must have TSDoc comments.
- Internal/private entities should not have TSDoc comments.  
- If a piece of documentation could make sence both on a module level, and a function/class level, put it on the module level.
- Documentation should never contain implementation details or any information about what the function does internally.

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

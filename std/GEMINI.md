This is the physim standard library

# Protocol for implementing features

These are the steps for implementing a feature:

1.  The user asks for you to plan a feature.
2.  You give a plan for how the feature should be implemented, without implementing anything. Feature should NEVER be implemented without the user accepting a plan.
3.  The user accepts the plan or asks for revisions.
4.  If the plan should be implemented, implement it, but ask if any questions come up.

# Code styling

See the code styling guidelines in `STYLE.md`
If you see code, where these principles are not being complied with, you should ask the user for permission to fix it.

# General Instructions

- See `docs/bin/md` for documentation.
- See `STRUCTURE.md` for a detailed project structure.
- See `README.md` for information about the project.
- See `DEVELOPMENT.md` for information about the development process.
- Look in `../sandbox.d.ts` and `../sound.ts` for an environment description.
- Always read `README.md`, `STYLE.md`, `DEVELOPMENT.md` and `STRUCTURE.md`, before doing anything.
- Always read other files that might be relevant for a task.

# Tasks

## Task: Check documentation

### Goal

Check documentation for correctness, completeness and consistency.

### Steps

1. Read TSDoc comments in the source code, while looking for problems
2. Check that the styling guidelines in `STYLE.md` are being followed
3. Fix any problems found

### Response

- Give a short summary of the fixed problems
- Explain any inconsistencies that where found between documentation, including examples. These inconsistencies should not be fixed, unless the style guidelines are being violated.
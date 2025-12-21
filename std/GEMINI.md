This is the physim standard library

# Protocol for implementing features

These are the steps for implementing a feature:
 1. The user asks for you to plan a feature.
 2. You give a plan for how the feature should be implemented, without implementing anything. Feature should NEVER be implemented without the user accepting a plan.
 3. The user accepts the plan or asks for revisions.
 4. Once the plan is approved the user will tell you whether to save the plan, or implement it.
 5. If the plan should be saved, save it to a markdown document in the "feature_reports" directory.
 6. If the plan should be implemented, implement it, but ask if any questions come up.

# Code styling

This is how code should be styled:
 1. Very minimal code comments.
 2. Document everything, that is exposed to the user of the library, like functions and classes, but not internal things or flattened modules.

If you see code, where these principles are not being complied with, you should ask the user for permission to fix it.

# General Instructions

- See `docs/bin/md` for documentation
- See `STRUCTURE.md` for a detailed project structure.
- Look in `../sandbox.d.ts` for an environment description.
- Always read the relevant files for a task.

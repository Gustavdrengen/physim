# Development cycle

This is how a feature should be implemented:

1. Outline the features public API
2. Update the test suite to match the new API
3. Implement the feature
4. Optimize and improve the feature implementation
5. Confirm that no problems arose from the feature implementation

- Use the graph generation script for file-dependency graph
- Use the documentation check script to check for missing docstrings

Once in a while this should be done:

1. Check for things that could be improved in the API and improve them
2. Check for improvement that could be made in the development cycle, design guidelines, style guidelines or other parts of the development process.
3. Check for problems

## Problems

The following things are considered problems in the code:

- Bugs
- Wrong internal structure
  - Something being located in the wrong layer
  - Something simply being poorly structured
  - Large files that should be split up
- Design guidelines not being followed
- Styling guidelines not being followed
- Incorrect documentation
- Incomprehensive testing

## Testing

- The tests directory should mirror the src/public directory, but with .test.ts extensions instead of .ts extensions
  - A test file can also be split up into a directory, so for example src/public/draw.ts correspond to all files in tests/draw
- Each file should be comprehensively tested
  - This includes all functionality
  - This does not include things that only tunes the behavour, but does not define it
  - Example: the particle system should be tested, but the default emmision values should not, as it does not define the behavoiur, only tune it.

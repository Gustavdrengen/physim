# Development cycle

This is how a feature should be implemented:

1. Outline the features public API
2. Create a test for the feature (not yet)
3. Implement the feature
4. Optimize and improve the feature implementation
5. Confirm that no problems arose from the feature implementation
  - Use the graph generation script for file-dependency graph

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
- Incomprehensive testing (not yet)

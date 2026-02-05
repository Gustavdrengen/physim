# Design guidelines for the CLI tool (core)

## Behaviour

### Error codes

The only status codes that the program should return under any circumstances are:

- 0: Success
- 2: Incorrectly formatted commands
- 65: Incorrect input
- 69: Something is wrong in the enviorment
- 70: Internal error

## Internal design

- Dont write to stdout dirrectly, use functions from src/print.ts

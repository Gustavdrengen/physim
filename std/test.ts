import { Color } from "./src/base/draw/color.ts";

/**
 * Test library for physim tests.
 */

interface AssertionError extends Error {
  expected?: any;
  actual?: any;
}

/**
 * Assertion builder for test expectations.
 */
class Assertions {
  public not!: Assertions;

  constructor(
    private actual: any,
    private inverted = false,
  ) {
    if (!inverted) {
      this.not = new Assertions(actual, true);
    }
  }

  toBe(expected: any): void {
    const pass = this.actual === expected;
    if (this.inverted) {
      if (pass) {
        const error: AssertionError = new Error(
          `Expected value not to be ${JSON.stringify(expected)}`,
        );
        error.expected = expected;
        error.actual = this.actual;
        throw error;
      }
    } else {
      if (!pass) {
        const error: AssertionError = new Error(
          `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(
            this.actual,
          )}`,
        );
        error.expected = expected;
        error.actual = this.actual;
        throw error;
      }
    }
  }

  toEqual(expected: any): void {
    const actualStr = JSON.stringify(this.actual);
    const expectedStr = JSON.stringify(expected);
    const pass = actualStr === expectedStr;

    if (this.inverted) {
      if (pass) {
        const error: AssertionError = new Error(
          `Expected ${actualStr} not to equal ${expectedStr}`,
        );
        error.expected = expected;
        error.actual = this.actual;
        throw error;
      }
    } else {
      if (!pass) {
        const error: AssertionError = new Error(
          `Expected ${expectedStr} but got ${actualStr}`,
        );
        error.expected = expected;
        error.actual = this.actual;
        throw error;
      }
    }
  }

  toBeTruthy(): void {
    const pass = !!this.actual;
    if (this.inverted) {
      if (pass) {
        const error: AssertionError = new Error(
          `Expected value not to be truthy, but got ${JSON.stringify(
            this.actual,
          )}`,
        );
        error.actual = this.actual;
        throw error;
      }
    } else {
      if (!pass) {
        const error: AssertionError = new Error(
          `Expected truthy value but got ${JSON.stringify(this.actual)}`,
        );
        error.actual = this.actual;
        throw error;
      }
    }
  }

  toBeFalsy(): void {
    const pass = !this.actual;
    if (this.inverted) {
      if (pass) {
        const error: AssertionError = new Error(
          `Expected value not to be falsy, but got ${JSON.stringify(
            this.actual,
          )}`,
        );
        error.actual = this.actual;
        throw error;
      }
    } else {
      if (!pass) {
        const error: AssertionError = new Error(
          `Expected falsy value but got ${JSON.stringify(this.actual)}`,
        );
        error.actual = this.actual;
        throw error;
      }
    }
  }

  toBeNull(): void {
    const pass = this.actual === null;
    if (this.inverted) {
      if (pass) {
        const error: AssertionError = new Error(
          `Expected value not to be null, but got ${JSON.stringify(
            this.actual,
          )}`,
        );
        error.actual = this.actual;
        throw error;
      }
    } else {
      if (!pass) {
        const error: AssertionError = new Error(
          `Expected null but got ${JSON.stringify(this.actual)}`,
        );
        error.actual = this.actual;
        throw error;
      }
    }
  }

  toBeUndefined(): void {
    const pass = this.actual === undefined;
    if (this.inverted) {
      if (pass) {
        const error: AssertionError = new Error(
          `Expected value not to be undefined, but got ${JSON.stringify(
            this.actual,
          )}`,
        );
        error.actual = this.actual;
        throw error;
      }
    } else {
      if (!pass) {
        const error: AssertionError = new Error(
          `Expected undefined but got ${JSON.stringify(this.actual)}`,
        );
        error.actual = this.actual;
        throw error;
      }
    }
  }

  toContain(item: any): void {
    let pass = false;
    if (Array.isArray(this.actual)) {
      pass = this.actual.includes(item);
    } else if (typeof this.actual === "string") {
      pass = this.actual.includes(item);
    } else {
      throw new Error("toContain() requires an array or string");
    }

    if (this.inverted) {
      if (pass) {
        const error: AssertionError = new Error(
          `Expected collection not to contain ${JSON.stringify(item)}`,
        );
        error.actual = this.actual;
        error.expected = item;
        throw error;
      }
    } else {
      if (!pass) {
        if (Array.isArray(this.actual)) {
          const error: AssertionError = new Error(
            `Expected array to contain ${JSON.stringify(item)}`,
          );
          error.actual = this.actual;
          error.expected = item;
          throw error;
        } else {
          // string
          const error: AssertionError = new Error(
            `Expected string to contain "${item}"`,
          );
          error.actual = this.actual;
          error.expected = item;
          throw error;
        }
      }
    }
  }

  toThrow(expectedError?: string | RegExp): void {
    if (this.inverted) {
      if (typeof this.actual !== "function") {
        throw new Error("toThrow() requires a function");
      }
      try {
        this.actual();
      } catch (e) {
        throw new Error("Expected function not to throw, but it did");
      }
      return;
    }

    if (typeof this.actual !== "function") {
      throw new Error("toThrow() requires a function");
    }

    let thrown = false;
    let error: any = null;

    try {
      this.actual();
    } catch (e) {
      thrown = true;
      error = e;
    }

    if (!thrown) {
      throw new Error("Expected function to throw but it didn't");
    }

    if (expectedError) {
      const message = error?.message || String(error);
      if (typeof expectedError === "string") {
        if (!message.includes(expectedError)) {
          throw new Error(
            `Expected error message to contain "${expectedError}" but got "${message}"`,
          );
        }
      } else {
        if (!expectedError.test(message)) {
          throw new Error(
            `Expected error message to match ${expectedError} but got "${message}"`,
          );
        }
      }
    }
  }

  toBeCloseTo(expected: number, precision = 2): void {
    if (typeof this.actual !== "number" || typeof expected !== "number") {
      throw new Error("toBeCloseTo() requires number values");
    }
    const pass =
      Math.abs(expected - this.actual) < Math.pow(10, -precision) / 2;
    if (this.inverted) {
      if (pass) {
        throw new Error(
          `Expected ${this.actual} not to be close to ${expected} (precision: ${precision})`,
        );
      }
    } else {
      if (!pass) {
        throw new Error(
          `Expected ${this.actual} to be close to ${expected} (precision: ${precision})`,
        );
      }
    }
  }

  toBeGreaterThan(expected: number): void {
    if (typeof this.actual !== 'number' || typeof expected !== 'number') {
      throw new Error("toBeGreaterThan() requires number values");
    }
    const pass = this.actual > expected;
    if (this.inverted) {
      if (pass) {
        throw new Error(`Expected ${this.actual} not to be greater than ${expected}`);
      }
    } else {
      if (!pass) {
        throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
      }
    }
  }

  toBeLessThan(expected: number): void {
    if (typeof this.actual !== 'number' || typeof expected !== 'number') {
      throw new Error("toBeLessThan() requires number values");
    }
    const pass = this.actual < expected;
    if (this.inverted) {
      if (pass) {
        throw new Error(`Expected ${this.actual} not to be less than ${expected}`);
      }
    } else {
      if (!pass) {
        throw new Error(`Expected ${this.actual} to be less than ${expected}`);
      }
    }
  }
}

/**
 * Create an expectation for testing.
 */
export function expect(actual: any): Assertions {
  return new Assertions(actual);
}

/**
 * Retrieves the color of a pixel from the canvas.
 * @param x The x-coordinate of the pixel.
 * @param y The y-coordinate of the pixel.
 * @returns A Color object representing the pixel's color.
 */
export function getPixelColor(x: number, y: number): Color {
  const pixelData = sim.ctx.getImageData(x, y, 1, 1).data;
  return new Color(
    pixelData[0],
    pixelData[1],
    pixelData[2],
    pixelData[3] / 255,
  );
}

/**
 * Simple synchronous test runner.
 */
export function test(name: string, fn: () => void): void {
  try {
    fn(); // run the test
    sim.log(JSON.stringify({ type: "test_pass", name }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sim.log(JSON.stringify({ type: "test_fail", name, error: errorMessage }));
  }
}

/**
 * Asynchronous test runner.
 */
export async function testAsync(
  name: string,
  fn: () => void | Promise<void>,
): Promise<void> {
  try {
    await fn(); // await async function if it returns a promise
    sim.log(JSON.stringify({ type: "test_pass", name }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sim.log(JSON.stringify({ type: "test_fail", name, error: errorMessage }));
  }
}

/**
 * Should be called when all tests are done.
 */
export function finish(): void {
  sim.finish();
}

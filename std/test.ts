/**
 * Test library for physim tests.
 * Communicates with the Python test runner via sim.log() JSON messages.
 */

interface AssertionError extends Error {
  expected?: any;
  actual?: any;
}

/**
 * Assertion builder for test expectations.
 */
class Assertions {
  constructor(private actual: any) { }

  toBe(expected: any): void {
    if (this.actual !== expected) {
      const error: AssertionError = new Error(
        `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(this.actual)}`
      );
      error.expected = expected;
      error.actual = this.actual;
      throw error;
    }
  }

  toEqual(expected: any): void {
    const actualStr = JSON.stringify(this.actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      const error: AssertionError = new Error(
        `Expected ${expectedStr} but got ${actualStr}`
      );
      error.expected = expected;
      error.actual = this.actual;
      throw error;
    }
  }

  toBeTruthy(): void {
    if (!this.actual) {
      const error: AssertionError = new Error(
        `Expected truthy value but got ${JSON.stringify(this.actual)}`
      );
      error.actual = this.actual;
      throw error;
    }
  }

  toBeFalsy(): void {
    if (this.actual) {
      const error: AssertionError = new Error(
        `Expected falsy value but got ${JSON.stringify(this.actual)}`
      );
      error.actual = this.actual;
      throw error;
    }
  }

  toBeNull(): void {
    if (this.actual !== null) {
      const error: AssertionError = new Error(
        `Expected null but got ${JSON.stringify(this.actual)}`
      );
      error.actual = this.actual;
      throw error;
    }
  }

  toBeUndefined(): void {
    if (this.actual !== undefined) {
      const error: AssertionError = new Error(
        `Expected undefined but got ${JSON.stringify(this.actual)}`
      );
      error.actual = this.actual;
      throw error;
    }
  }

  toContain(item: any): void {
    if (Array.isArray(this.actual)) {
      if (!this.actual.includes(item)) {
        const error: AssertionError = new Error(
          `Expected array to contain ${JSON.stringify(item)}`
        );
        error.actual = this.actual;
        error.expected = item;
        throw error;
      }
    } else if (typeof this.actual === "string") {
      if (!this.actual.includes(item)) {
        const error: AssertionError = new Error(
          `Expected string to contain "${item}"`
        );
        error.actual = this.actual;
        error.expected = item;
        throw error;
      }
    } else {
      throw new Error("toContain() requires an array or string");
    }
  }

  toThrow(expectedError?: string | RegExp): void {
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
            `Expected error message to contain "${expectedError}" but got "${message}"`
          );
        }
      } else {
        if (!expectedError.test(message)) {
          throw new Error(
            `Expected error message to match ${expectedError} but got "${message}"`
          );
        }
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
 * Simple synchronous test runner.
 */
export function test(name: string, fn: () => void): void {
  try {
    fn(); // run the test
    sim.log(JSON.stringify({ type: "test_pass", name }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    sim.log(
      JSON.stringify({ type: "test_fail", name, error: errorMessage })
    );
  }
}

/**
 * Asynchronous test runner.
 */
export async function testAsync(
  name: string,
  fn: () => void | Promise<void>
): Promise<void> {
  try {
    await fn(); // await async function if it returns a promise
    sim.log(JSON.stringify({ type: "test_pass", name }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    sim.log(
      JSON.stringify({ type: "test_fail", name, error: errorMessage })
    );
  }
}


/**
 * Should be called when all tests are done.
 */
export function finish(): void {
  sim.finish();
}

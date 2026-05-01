import { test, expect } from "../test.ts";
import { log, info, debug, warning, error } from "physim/logging";

await test("log calls sim.log without prefix", () => {
  const logMessages: any[] = [];
  const originalLog = (globalThis as any).sim.log;
  (globalThis as any).sim.log = (...args: any[]) => {
    logMessages.push(args);
  };

  log("hello", 1, { a: 1 });
  expect(logMessages.length).toBe(1);
  expect(logMessages[0][0]).toBe("hello");
  expect(logMessages[0][1]).toBe(1);
  expect(logMessages[0][2].a).toBe(1);

  (globalThis as any).sim.log = originalLog;
});

await test("info layer logs with [info] prefix", () => {
  const logMessages: any[] = [];
  const originalLog = (globalThis as any).sim.log;
  (globalThis as any).sim.log = (...args: any[]) => {
    logMessages.push(args);
  };

  info("hello", 1, { a: 1 });
  expect(logMessages.length).toBe(1);
  expect(logMessages[0][0]).toBe("[info]");
  expect(logMessages[0][1]).toBe("hello");
  expect(logMessages[0][2]).toBe(1);
  expect(logMessages[0][3].a).toBe(1);

  (globalThis as any).sim.log = originalLog;
});

await test("debug layer logs with [debug] prefix", () => {
  const logMessages: any[] = [];
  const originalLog = (globalThis as any).sim.log;
  (globalThis as any).sim.log = (...args: any[]) => {
    logMessages.push(args);
  };

  debug("debug message");
  expect(logMessages.length).toBe(1);
  expect(logMessages[0][0]).toBe("[debug]");
  expect(logMessages[0][1]).toBe("debug message");

  (globalThis as any).sim.log = originalLog;
});

await test("warning layer logs with [warning] prefix", () => {
  const logMessages: any[] = [];
  const originalLog = (globalThis as any).sim.log;
  (globalThis as any).sim.log = (...args: any[]) => {
    logMessages.push(args);
  };

  warning("warning message");
  expect(logMessages.length).toBe(1);
  expect(logMessages[0][0]).toBe("[warning]");
  expect(logMessages[0][1]).toBe("warning message");

  (globalThis as any).sim.log = originalLog;
});

await test("error layer logs with [error] prefix", () => {
  const logMessages: any[] = [];
  const originalLog = (globalThis as any).sim.log;
  (globalThis as any).sim.log = (...args: any[]) => {
    logMessages.push(args);
  };

  error("error message");
  expect(logMessages.length).toBe(1);
  expect(logMessages[0][0]).toBe("[error]");
  expect(logMessages[0][1]).toBe("error message");

  (globalThis as any).sim.log = originalLog;
});

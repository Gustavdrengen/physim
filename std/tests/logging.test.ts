import { test, expect } from "../test.ts";
import { log } from "physim/logging";

await test("logging calls sim.log", () => {
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

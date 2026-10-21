import { describe, expect, it } from "vitest";
import { createTeardowns } from "./teardowns";

describe("createTeardowns", () => {
  it("runs the last added first, once", () => {
    const ran: string[] = [];
    const teardowns = createTeardowns();
    teardowns.add(() => ran.push("first"));
    teardowns.add(() => ran.push("second"));
    expect(teardowns.done()).toBe(false);
    teardowns.runAll();
    teardowns.runAll();
    expect(ran).toEqual(["second", "first"]);
    expect(teardowns.done()).toBe(true);
  });

  it("runs each through the runner given", () => {
    const teardowns = createTeardowns();
    teardowns.add(() => {
      throw new Error("gone");
    });
    const failures: unknown[] = [];
    teardowns.runAll((teardown) => {
      try {
        teardown();
      } catch (error) {
        failures.push(error);
      }
    });
    expect(failures).toEqual([new Error("gone")]);
  });
});

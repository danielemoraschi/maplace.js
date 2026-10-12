import { afterEach, describe, expect, it, vi } from "vitest";
import { runSafely } from "./safely";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("runSafely", () => {
  it("returns what the action returns", () => {
    expect(runSafely(() => 42)).toBe(42);
  });

  it("returns undefined for a throwing action and rethrows its error in a microtask", () => {
    const queued: (() => void)[] = [];
    vi.stubGlobal("queueMicrotask", (task: () => void) => queued.push(task));
    const error = new Error("adapter bug");
    const result = runSafely(() => {
      throw error;
    });
    expect(result).toBeUndefined();
    expect(queued).toHaveLength(1);
    expect(() => queued[0]?.()).toThrow(error);
  });
});

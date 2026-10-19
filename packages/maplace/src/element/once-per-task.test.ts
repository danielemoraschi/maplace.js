import { describe, expect, it, vi } from "vitest";
import { oncePerTask } from "./once-per-task";

describe("oncePerTask", () => {
  it("runs once after the calls made together, not during them", async () => {
    const run = vi.fn();
    const schedule = oncePerTask(run);
    schedule();
    schedule();
    expect(run).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(run).toHaveBeenCalledOnce();
  });

  it("runs again for calls made after it ran", async () => {
    const run = vi.fn();
    const schedule = oncePerTask(run);
    schedule();
    await Promise.resolve();
    schedule();
    await Promise.resolve();
    expect(run).toHaveBeenCalledTimes(2);
  });
});

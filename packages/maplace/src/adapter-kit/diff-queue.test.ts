import { describe, expect, it } from "vitest";
import type { LocationDiff } from "../adapter";
import { createDiffQueue } from "./diff-queue";

const removing = (id: string): LocationDiff => ({ added: [], updated: [], removed: [id] });

describe("createDiffQueue", () => {
  it("draws diffs in order, each once the one before has drawn", async () => {
    const drawn: string[] = [];
    let finishFirst = () => {};
    const firstDrawn = new Promise<void>((resolve) => (finishFirst = resolve));
    const queue = createDiffQueue(async ({ removed: [id = ""] }) => {
      if (id === "a") await firstDrawn;
      drawn.push(id);
    }, String);
    const first = queue.apply(removing("a"));
    const second = queue.apply(removing("b"));
    expect(queue.applied()).toBe(2);
    expect(queue.drawnThrough(1)).toBe(false);
    finishFirst();
    await Promise.all([first, second]);
    expect(drawn).toEqual(["a", "b"]);
    expect(queue.drawnThrough(2)).toBe(true);
  });

  it("reports a failure without rejecting, and later diffs still draw", async () => {
    const failures: unknown[] = [];
    const drawn: string[] = [];
    const queue = createDiffQueue(
      async ({ removed: [id = ""] }) => {
        if (id === "a") throw new Error("no");
        drawn.push(id);
      },
      (cause) => failures.push(cause),
    );
    await expect(queue.apply(removing("a"))).resolves.toBeUndefined();
    await queue.apply(removing("b"));
    expect(failures).toEqual([new Error("no")]);
    expect(drawn).toEqual(["b"]);
    expect(queue.drawnThrough(2)).toBe(true);
  });
});

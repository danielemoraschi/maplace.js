import { describe, expect, it } from "vitest";
import { inChunks } from "./chunks";

const items = Array.from({ length: 10 }, (_, index) => index);

describe("inChunks", () => {
  it("works through every item in order, yielding to the event loop between chunks", async () => {
    const seen: (number | "tick")[] = [];
    const working = inChunks(items, {
      size: 4,
      each: (item) => seen.push(item),
      stopped: () => false,
    });
    setTimeout(() => seen.push("tick"), 0);
    await working;
    expect(seen.filter((entry) => entry !== "tick")).toEqual(items);
    expect(seen.indexOf("tick")).toBeLessThan(seen.indexOf(9));
  });

  it("finishes a list of one chunk without yielding", async () => {
    const seen: (number | "tick")[] = [];
    setTimeout(() => seen.push("tick"), 0);
    await inChunks(items, { size: 10, each: (item) => seen.push(item), stopped: () => false });
    expect(seen).not.toContain("tick");
  });

  it("stops between chunks once told", async () => {
    const seen: number[] = [];
    let stop = false;
    const working = inChunks(items, {
      size: 4,
      each: (item) => seen.push(item),
      stopped: () => stop,
    });
    stop = true;
    await working;
    expect(seen).toEqual([0, 1, 2, 3]);
  });
});

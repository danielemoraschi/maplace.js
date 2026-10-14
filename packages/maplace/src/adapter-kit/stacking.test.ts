import { describe, expect, it } from "vitest";
import { createOrderCounter, stackRank } from "./stacking";

const plain = { selected: false, hovered: false };

describe("stackRank", () => {
  it("stacks the later added in front", () => {
    const next = createOrderCounter();
    const [first, second] = [next(), next()];
    expect(stackRank(second, plain)).toBeGreaterThan(stackRank(first, plain));
  });

  it("puts the selected marker above the rest, and the hovered one above that", () => {
    const late = 1_000_000;
    const selected = stackRank(1, { selected: true, hovered: false });
    expect(selected).toBeGreaterThan(stackRank(late, plain));
    expect(stackRank(2, { selected: true, hovered: true })).toBeGreaterThan(selected);
    expect(stackRank(2, { selected: false, hovered: true })).toBeGreaterThan(selected);
  });
});

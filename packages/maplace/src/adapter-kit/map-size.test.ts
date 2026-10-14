import { describe, expect, it } from "vitest";
import { hasSize, sameSize, sizeOf } from "./map-size";

describe("a map's size", () => {
  it("is its element's", () => {
    const element = { clientWidth: 300, clientHeight: 200 } as HTMLElement;
    expect(sizeOf(element)).toEqual({ width: 300, height: 200 });
  });

  it("is none while either side is 0, as in a closed tab", () => {
    expect(hasSize({ width: 300, height: 200 })).toBe(true);
    expect(hasSize({ width: 0, height: 200 })).toBe(false);
    expect(hasSize({ width: 300, height: 0 })).toBe(false);
  });

  it("is the same only when both sides are", () => {
    expect(sameSize({ width: 1, height: 2 }, { width: 1, height: 2 })).toBe(true);
    expect(sameSize({ width: 1, height: 2 }, { width: 2, height: 2 })).toBe(false);
  });
});

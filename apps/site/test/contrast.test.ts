import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast.ts";

describe("contrastRatio", () => {
  it("measures WCAG's ratio either way round, 21 for white on black", () => {
    expect(contrastRatio("rgb(255, 255, 255)", "rgb(0, 0, 0)")).toBeCloseTo(21, 5);
    expect(contrastRatio("rgb(0, 0, 0)", "rgba(255, 255, 255, 1)")).toBeCloseTo(21, 5);
    expect(contrastRatio("rgb(255, 255, 255)", "rgb(207, 43, 36)")).toBeCloseTo(5.22, 2);
  });

  it("refuses a translucent colour, whose contrast depends on what's under it", () => {
    expect(() => contrastRatio("rgb(255, 255, 255)", "rgba(0, 0, 0, 0)")).toThrow(/translucent/);
    expect(() => contrastRatio("red", "rgb(0, 0, 0)")).toThrow(/isn't a computed rgb/);
  });
});

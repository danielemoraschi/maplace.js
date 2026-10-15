import { describe, expect, it } from "vitest";
import { placementOf } from "./placement";

const SELECTED = { selected: true, hovered: false };
const NOT_SELECTED = { selected: false, hovered: true };

describe("placementOf", () => {
  it("puts a hidden marker in no cluster, the selected one alone, the rest in clusters", () => {
    expect(placementOf(false, SELECTED)).toBe("hidden");
    expect(placementOf(true, SELECTED)).toBe("alone");
    expect(placementOf(true, NOT_SELECTED)).toBe("clustered");
  });
});

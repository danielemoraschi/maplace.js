import { describe, expect, it } from "vitest";
import { OPENFREEMAP_BRIGHT, OPENFREEMAP_STYLES } from "./openfreemap-styles";
import { openingStyleOf } from "./opening-style";

describe("openingStyleOf", () => {
  it("is the style a MapLibre page names in map-style", () => {
    expect(openingStyleOf("whats-on")).toBe(`${OPENFREEMAP_STYLES}liberty`);
  });

  it("is OpenFreeMap's bright for a page naming none", () => {
    expect(openingStyleOf("simple")).toBe(OPENFREEMAP_BRIGHT);
  });
});

import { describe, expect, it } from "vitest";
import { createFakeAdapter } from "../testing/fake-adapter";
import { createMaplace } from "./create";

// 0.2 scenarios about misuse (RFC Appendix A, regression-test candidates): it throws, by name.

describe("#60: no zIndex to fight over", () => {
  it("refuses zIndex with the 1.0 answer: the selected or hovered location stacks on top", () => {
    const locations = [{ id: "a", lat: 0, lng: 0, zIndex: 5 }] as never;
    expect(() => createMaplace({ locations })).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        locationId: "a",
        message: expect.stringContaining("the selected or hovered location stacks on top"),
      }),
    );
  });
});

describe("#183: a page without a map element gets a named error, not a TypeError", () => {
  it("throws invalid-input naming the container", () => {
    const maplace = createMaplace();
    expect(() => maplace.attach(createFakeAdapter(), null as never)).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "container" }),
    );
  });
});

// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { myLocationAsked } from "./map-my-location";
import { elementWith } from "./testing/dom";

describe("myLocationAsked", () => {
  it("asks nothing without the label, whatever else is there", () => {
    expect(myLocationAsked(elementWith({ "my-location-position": "middle" }))).toBeUndefined();
  });

  it("a bare label takes the default words, in the default corner", () => {
    expect(myLocationAsked(elementWith({ "my-location-label": "" }))).toEqual({
      corner: "top-left",
      options: { label: undefined, unavailableLabel: undefined },
    });
  });

  it("a blank unavailable label takes the default words too", () => {
    const host = elementWith({
      "my-location-label": "Near me",
      "my-location-unavailable-label": " ",
    });
    expect(myLocationAsked(host)?.options).toEqual({
      label: "Near me",
      unavailableLabel: undefined,
    });
  });

  it("reads its corner, and a bad one names its attribute", () => {
    const named = { "my-location-label": "", "my-location-position": "bottom-right" };
    expect(myLocationAsked(elementWith(named))?.corner).toBe("bottom-right");
    const bad = { "my-location-label": "", "my-location-position": "middle" };
    expect(() => myLocationAsked(elementWith(bad))).toThrow(/my-location-position/);
  });
});

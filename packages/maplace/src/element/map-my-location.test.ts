// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { myLocationAsked } from "./map-my-location";
import { elementWith } from "./testing/dom";

describe("myLocationAsked", () => {
  it("asks nothing without the switch, whatever else is there", () => {
    const labelled = { "my-location-label": "Near me", "my-location-position": "middle" };
    expect(myLocationAsked(elementWith(labelled))).toBeUndefined();
  });

  it("asks nothing with the switch off", () => {
    expect(myLocationAsked(elementWith({ "my-location": "false" }))).toBeUndefined();
  });

  it("refuses a switch that is neither true nor false, naming it", () => {
    expect(() => myLocationAsked(elementWith({ "my-location": "maybe" }))).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "my-location" }),
    );
  });

  it("the bare switch leaves the words to the control, in the default corner", () => {
    expect(myLocationAsked(elementWith({ "my-location": "" }))).toEqual({
      corner: "top-left",
      options: { label: undefined, unavailableLabel: undefined },
    });
  });

  it("a blank unavailable label takes the default words too", () => {
    const host = elementWith({
      "my-location": "",
      "my-location-label": "Near me",
      "my-location-unavailable-label": " ",
    });
    expect(myLocationAsked(host)?.options).toEqual({
      label: "Near me",
      unavailableLabel: undefined,
    });
  });

  it("reads its corner, and a bad one names its attribute", () => {
    const named = { "my-location": "", "my-location-position": "bottom-right" };
    expect(myLocationAsked(elementWith(named))?.corner).toBe("bottom-right");
    const bad = { "my-location": "", "my-location-position": "middle" };
    expect(() => myLocationAsked(elementWith(bad))).toThrow(/my-location-position/);
  });
});

import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { isHeatMarker } from "../options";
import { checkHeatMarker } from "./heat-marker";
import { locationRoot } from "./location";

const quake: Location = { id: "q", lat: 0, lng: 0, group: "quakes" };
const QUAKES = { groups: ["quakes"] };

describe("isHeatMarker", () => {
  it("is a marker in the heatmap's groups, or any marker when it names none", () => {
    expect(isHeatMarker(quake, QUAKES)).toBe(true);
    expect(isHeatMarker({ ...quake, group: "volcanoes" }, QUAKES)).toBe(false);
    expect(isHeatMarker({ id: "n", lat: 0, lng: 0 }, QUAKES)).toBe(false);
    expect(isHeatMarker({ id: "n", lat: 0, lng: 0 }, {})).toBe(true);
    expect(isHeatMarker(quake, undefined)).toBe(false);
  });

  it("is never a shape", () => {
    const circle: Location = { id: "c", type: "circle", center: { lat: 0, lng: 0 }, radius: 1 };
    expect(isHeatMarker(circle, {})).toBe(false);
  });
});

describe("checkHeatMarker", () => {
  const field = locationRoot("q");

  it("refuses an icon or editable marker in the heat", () => {
    expect(() => checkHeatMarker({ ...quake, icon: "x" }, QUAKES, field)).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        field: "icon",
        message: expect.stringContaining("drawn as heat and a dot: it can't have an icon"),
      }),
    );
    expect(() => checkHeatMarker({ ...quake, editable: true }, QUAKES, field)).toThrow(
      expect.objectContaining({ field: "editable" }),
    );
  });

  it("allows both outside the heat", () => {
    const volcano = { ...quake, group: "volcanoes", icon: "x", editable: true };
    expect(() => checkHeatMarker(volcano, QUAKES, field)).not.toThrow();
    expect(() => checkHeatMarker({ ...quake, icon: "x" }, undefined, field)).not.toThrow();
  });
});

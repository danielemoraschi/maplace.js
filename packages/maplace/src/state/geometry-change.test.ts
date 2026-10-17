import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { NO_CHANGE } from "./change";
import { changeGeometry } from "./geometry-change";
import { initialSnapshot } from "./initial";

const pin: Location = { id: "pin", lat: 1, lng: 2, title: "Pin", editable: true };
const fixed: Location = { id: "fixed", lat: 0, lng: 0 };
const area: Location = {
  id: "area",
  type: "circle",
  center: { lat: 0, lng: 0 },
  radius: 10,
  editable: true,
};
const snapshot = initialSnapshot({ locations: [pin, fixed, area] });

describe("changeGeometry", () => {
  it("writes the geometry back as a new location, then fires locationChange with both", () => {
    const change = changeGeometry(snapshot, {
      id: "pin",
      geometry: { type: "marker", lat: 5, lng: 6 },
    });
    const location = change.patch.locations?.[0];
    expect(location).toEqual({ ...pin, lat: 5, lng: 6 });
    expect(location).not.toHaveProperty("type");
    expect(change.patch.locations?.slice(1)).toEqual([fixed, area]);
    expect(Object.isFrozen(change.patch.locations)).toBe(true);
    expect(change.events).toEqual([
      { name: "locationChange", payload: { location, previous: pin } },
    ]);
  });

  it("changes nothing for a location the store no longer has", () => {
    const report = { id: "gone", geometry: { type: "marker", lat: 0, lng: 0 } } as const;
    expect(changeGeometry(snapshot, report)).toBe(NO_CHANGE);
  });

  it("throws on what the adapter should never report", () => {
    const marker = { type: "marker", lat: 0, lng: 0 } as const;
    expect(() => changeGeometry(snapshot, { id: "fixed", geometry: marker })).toThrow(
      `location "fixed": editable is not true, so the map can't change its geometry`,
    );
    expect(() => changeGeometry(snapshot, { id: "area", geometry: marker })).toThrow(
      `location "area": type is circle, got a marker geometry`,
    );
    expect(() =>
      changeGeometry(snapshot, { id: "pin", geometry: { type: "marker", lat: 95, lng: 0 } }),
    ).toThrow(expect.objectContaining({ locationId: "pin", field: "lat" }));
  });
});

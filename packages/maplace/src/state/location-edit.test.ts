import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { NO_CHANGE } from "./change";
import { initialSnapshot } from "./initial";
import { locationEdited } from "./location-edit";

const pin: Location = { id: "pin", lat: 1, lng: 2, editable: true };
const fixed: Location = { id: "fixed", lat: 0, lng: 0 };
const field: Location = {
  id: "field",
  type: "polygon",
  path: [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 1 },
    { lat: 1, lng: 1 },
  ],
  editable: true,
};
const snapshot = initialSnapshot({ locations: [pin, fixed, field] });

describe("locationEdited", () => {
  it("fires locationEdit with the store's location and the geometry, keeping nothing", () => {
    const geometry = { type: "marker", lat: 5, lng: 6 } as const;
    const change = locationEdited(snapshot, { id: "pin", geometry });
    expect(change.patch).toEqual({});
    expect(change.events).toEqual([{ name: "locationEdit", payload: { location: pin, geometry } }]);
    const [event] = change.events;
    expect(event?.name === "locationEdit" && event.payload.location).toBe(snapshot.locations[0]);
  });

  it("gives a frozen copy of the geometry, so a listener can't move what the map shows", () => {
    const path = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 2 },
      { lat: 2, lng: 2 },
    ];
    const holes = [
      [
        { lat: 0.5, lng: 1 },
        { lat: 1, lng: 1.5 },
        { lat: 1, lng: 1 },
      ],
    ];
    const geometry = { type: "polygon", path, holes } as const;
    const [event] = locationEdited(snapshot, { id: "field", geometry }).events;
    const edited = event?.name === "locationEdit" ? event.payload.geometry : undefined;
    expect(edited).toEqual(geometry);
    expect(edited).not.toBe(geometry);
    expect(Object.isFrozen(edited)).toBe(true);
    if (edited?.type !== "polygon") throw new Error("expected a polygon");
    expect(edited.path).not.toBe(path);
    expect(Object.isFrozen(edited.path[0])).toBe(true);
    expect(Object.isFrozen(edited.holes?.[0]?.[0])).toBe(true);
  });

  it("changes nothing for a location the store no longer has", () => {
    const geometry = { type: "marker", lat: 0, lng: 0 } as const;
    expect(locationEdited(snapshot, { id: "gone", geometry })).toBe(NO_CHANGE);
  });

  it("throws on an edit the location can't take", () => {
    const marker = { type: "marker", lat: 0, lng: 0 } as const;
    expect(() => locationEdited(snapshot, { id: "fixed", geometry: marker })).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "editable" }),
    );
    expect(() => locationEdited(snapshot, { id: "field", geometry: marker })).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "type" }),
    );
    expect(() =>
      locationEdited(snapshot, { id: "pin", geometry: { type: "marker", lat: 200, lng: 0 } }),
    ).toThrow(expect.objectContaining({ code: "invalid-input", field: "lat" }));
  });
});

import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import type { Snapshot } from "../store";
import { NO_CHANGE } from "./change";
import { setLocations } from "./locations";

const at = { lat: 0, lng: 0 };
const a: Location = { id: "a", ...at };
const b: Location = { id: "b", ...at };
const NO_SANITIZER = { sanitize: undefined };

function snapshotOf(locations: Location[], fields: Partial<Snapshot> = {}): Snapshot {
  return {
    locations: Object.freeze(locations),
    selectedId: undefined,
    hoveredId: undefined,
    filter: undefined,
    view: { kind: "fit-all", padding: 40 },
    viewport: undefined,
    route: undefined,
    routeResult: undefined,
    loadState: "idle",
    ...fields,
  };
}

describe("setLocations", () => {
  it("sets a frozen copy of the list", () => {
    const next = [a, b];
    const locations = setLocations(snapshotOf([a]), next, NO_SANITIZER).patch.locations;
    expect(locations).toEqual(next);
    expect(locations).not.toBe(next);
    expect(Object.isFrozen(locations)).toBe(true);
  });

  it("changes nothing for the same objects in the same order, even in a new array", () => {
    expect(setLocations(snapshotOf([a, b]), [a, b], NO_SANITIZER)).toBe(NO_CHANGE);
  });

  it("validates only locations it doesn't hold already", () => {
    const held: Location = { id: "a", ...at };
    const current = snapshotOf([held]);
    // Broken after the store took it: reused objects are trusted, as the diff trusts them.
    Object.assign(held, { lat: 999 });
    expect(() => setLocations(current, [held, b], NO_SANITIZER)).not.toThrow();
    expect(() =>
      setLocations(current, [held, { id: "c", lat: 999, lng: 0 }], NO_SANITIZER),
    ).toThrow(/location "c": lat must be a number from -90 to 90/);
    expect(() => setLocations(current, [held, held], NO_SANITIZER)).toThrow(
      expect.objectContaining({ code: "duplicate-id" }),
    );
  });

  it("sees a list changed in place and passed again", () => {
    const list = [a];
    const current = snapshotOf([...list]);
    list.push(b);
    expect(setLocations(current, list, NO_SANITIZER).patch.locations).toEqual([a, b]);
  });

  it("deselects a selected location that is gone, and drops it from the route", () => {
    const c: Location = { id: "c", ...at };
    const current = snapshotOf([a, b, c], { selectedId: "b", route: { stops: ["a", "b", "c"] } });
    expect(setLocations(current, [a, c], NO_SANITIZER)).toEqual({
      patch: {
        locations: [a, c],
        selectedId: undefined,
        route: { stops: ["a", "c"] },
        routeResult: undefined,
      },
      events: [{ name: "selectionChange", payload: { id: undefined } }],
    });
  });

  it("deselects a selected location that is now hidden", () => {
    const hidden: Location = { id: "b", ...at, visible: false };
    expect(
      setLocations(snapshotOf([a, b], { selectedId: "b" }), [a, hidden], NO_SANITIZER).patch,
    ).toHaveProperty("selectedId", undefined);
  });

  it("validates the list with the store's sanitizer", () => {
    const html: Location = { id: "h", ...at, html: "<b>x</b>" };
    expect(() => setLocations(snapshotOf([]), [html], NO_SANITIZER)).toThrow(
      expect.objectContaining({ code: "missing-sanitizer" }),
    );
    expect(() =>
      setLocations(snapshotOf([]), [html], { sanitize: (text: string) => text }),
    ).not.toThrow();
    expect(() => setLocations(snapshotOf([]), [a, a], NO_SANITIZER)).toThrow(
      expect.objectContaining({ code: "duplicate-id" }),
    );
    expect(() => setLocations(snapshotOf([]), "a" as never, NO_SANITIZER)).toThrow(
      /^setLocations: locations must be an array/,
    );
  });
});

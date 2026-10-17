import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { NO_CHANGE } from "./change";
import { hover, hoverReported } from "./hover";
import { initialSnapshot } from "./initial";

const locations: Location[] = [
  { id: "a", lat: 0, lng: 0 },
  { id: "b", lat: 0, lng: 0, visible: false },
];
const snapshot = initialSnapshot({ locations });

describe("hover", () => {
  it("hovers a shown location, or clears with undefined", () => {
    expect(hover(snapshot, "a")).toEqual(hoverReported(snapshot, "a"));
    expect(hover({ ...snapshot, hoveredId: "a" }, undefined)).toEqual(
      hoverReported({ ...snapshot, hoveredId: "a" }, undefined),
    );
  });

  it("throws for an unknown or hidden id, as select does", () => {
    expect(() => hover(snapshot, "gone")).toThrow(
      expect.objectContaining({
        code: "unknown-id",
        message: 'hover: id must name a location, got "gone"',
      }),
    );
    expect(() => hover(snapshot, "b")).toThrow(
      expect.objectContaining({ code: "invalid-input", locationId: "b" }),
    );
    expect(() => hover(snapshot, "" as string)).toThrow(/hover: id must be a non-empty string/);
  });
});

describe("hoverReported", () => {
  it("sets hoveredId and fires hoverChange, onto a location and off it", () => {
    expect(hoverReported(snapshot, "a")).toEqual({
      patch: { hoveredId: "a" },
      events: [{ name: "hoverChange", payload: { id: "a" } }],
    });
    expect(hoverReported({ ...snapshot, hoveredId: "a" }, undefined)).toEqual({
      patch: { hoveredId: undefined },
      events: [{ name: "hoverChange", payload: { id: undefined } }],
    });
  });

  it("changes nothing for the same id, or one the store no longer shows", () => {
    expect(hoverReported({ ...snapshot, hoveredId: "a" }, "a")).toBe(NO_CHANGE);
    expect(hoverReported(snapshot, undefined)).toBe(NO_CHANGE);
    expect(hoverReported(snapshot, "b")).toBe(NO_CHANGE);
    expect(hoverReported(snapshot, "gone")).toBe(NO_CHANGE);
  });
});

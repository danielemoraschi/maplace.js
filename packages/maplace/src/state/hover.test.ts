import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { NO_CHANGE } from "./change";
import { hover } from "./hover";
import { initialSnapshot } from "./initial";

const locations: Location[] = [
  { id: "a", lat: 0, lng: 0 },
  { id: "b", lat: 0, lng: 0, visible: false },
];
const snapshot = initialSnapshot({ locations });

describe("hover", () => {
  it("sets hoveredId and fires hover, onto a location and off it", () => {
    expect(hover(snapshot, "a")).toEqual({
      patch: { hoveredId: "a" },
      events: [{ name: "hover", payload: { id: "a" } }],
    });
    expect(hover({ ...snapshot, hoveredId: "a" }, undefined)).toEqual({
      patch: { hoveredId: undefined },
      events: [{ name: "hover", payload: { id: undefined } }],
    });
  });

  it("changes nothing for the same id, or one the store no longer shows", () => {
    expect(hover({ ...snapshot, hoveredId: "a" }, "a")).toBe(NO_CHANGE);
    expect(hover(snapshot, undefined)).toBe(NO_CHANGE);
    expect(hover(snapshot, "b")).toBe(NO_CHANGE);
    expect(hover(snapshot, "gone")).toBe(NO_CHANGE);
  });
});

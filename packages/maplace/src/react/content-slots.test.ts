// @vitest-environment happy-dom
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Location } from "../location";
import { locationById } from "../location-state";
import type { ContentRenders } from "./content-renders";
import { createContentSession } from "./content-slots";

const LOCATIONS: readonly Location[] = Object.freeze([
  { id: "rome", lat: 41.9, lng: 12.5, title: "Rome" },
  { id: "park", type: "circle", center: { lat: 41.9, lng: 12.5 }, radius: 100 },
]);
const IDLE = { selected: false, hovered: false };
const SELECTED = { selected: true, hovered: false };

function session(renders: ContentRenders<unknown>, locations = LOCATIONS) {
  const report = vi.fn();
  const made = createContentSession({
    document,
    renders: { current: renders },
    locationOf: (id) => locationById(locations, id),
    report,
  });
  return { session: made, report };
}

const card: ContentRenders<unknown> = {
  popupContent: (location) => `card of ${location.id}`,
  markerIcon: (location, { selected }) => (selected ? `${location.id}, selected` : location.id),
};

describe("a content session", () => {
  it("gives a marker the same host at every ask, stamped with its state", () => {
    const { session: map } = session(card);
    const host = map.iconFor("rome", IDLE);
    expect(map.iconFor("rome", SELECTED)).toBe(host);
    expect(host?.hasAttribute("data-selected")).toBe(true);
    expect(map.markers()).toEqual([{ id: "rome", host, state: SELECTED }]);
  });

  it("keeps a marker's slot when asked again in the same state", () => {
    const { session: map } = session(card);
    map.iconFor("rome", IDLE);
    const [slot] = map.markers();
    const version = map.version();
    map.iconFor("rome", { ...IDLE });
    expect([map.markers()[0], map.version()]).toEqual([slot, version]);
  });

  it.each<[string, ReactNode]>([
    ["null", null],
    ["undefined", undefined],
    ["false", false],
  ])("gives nothing when the function renders %s, and forgets the slot it had", (_, nothing) => {
    let node: ReactNode = "★";
    const { session: map } = session({ markerIcon: () => node });
    expect(map.iconFor("rome", IDLE)).toBeDefined();
    node = nothing;
    expect(map.iconFor("rome", IDLE)).toBeUndefined();
    expect(map.markers()).toEqual([]);
  });

  it("gives nothing for a location gone from the store, or a shape's icon", () => {
    const { session: map } = session(card);
    expect(map.iconFor("gone", IDLE)).toBeUndefined();
    expect(map.iconFor("park", IDLE)).toBeUndefined();
    expect(map.popupFor("park")).toBeDefined();
  });

  it("counts a function that throws as content, for React to throw again", () => {
    const { session: map } = session({
      popupContent: () => {
        throw new Error("no card");
      },
    });
    expect(map.popupFor("rome")).toBeDefined();
  });

  it("keeps one popup: another location's takes its place, and a close drops it", () => {
    const { session: map } = session(card);
    const rome = map.popupFor("rome");
    expect(map.popupFor("rome")).toBe(rome);
    expect(map.popupFor("park")).not.toBe(rome);
    expect(map.popup()?.id).toBe("park");
    map.popupClosed("rome");
    expect(map.popup()?.id).toBe("park");
    map.popupClosed("park");
    expect(map.popup()).toBeUndefined();
  });

  it("forgets a removed location's slots", () => {
    const { session: map } = session(card);
    map.iconFor("rome", IDLE);
    map.popupFor("rome");
    map.removed(["rome"]);
    expect([map.markers(), map.popup()]).toEqual([[], undefined]);
  });

  it("makes nothing once ended", () => {
    const { session: map } = session(card);
    map.iconFor("rome", IDLE);
    map.popupFor("rome");
    map.end();
    expect([map.markers(), map.popup()]).toEqual([[], undefined]);
    expect(map.iconFor("rome", IDLE)).toBeUndefined();
  });

  it("holds a popup's report until its content is in, and runs it at once after", () => {
    const { session: map } = session(card);
    const report = vi.fn();
    map.popupFor("rome");
    map.whenPopupShown("rome", report);
    expect(report).not.toHaveBeenCalled();
    map.popupCommitted("rome");
    expect(report).toHaveBeenCalledOnce();
    map.whenPopupShown("rome", report);
    expect(report).toHaveBeenCalledTimes(2);
  });

  it("holds no report for a popup with no React content", () => {
    const { session: map } = session({});
    const report = vi.fn();
    map.whenPopupShown("rome", report);
    expect(report).toHaveBeenCalledOnce();
  });

  it("runs a held report before the popup goes: closed, replaced or removed", () => {
    const { session: map } = session(card);
    const reports = { closed: vi.fn(), replaced: vi.fn(), removed: vi.fn() };
    map.popupFor("rome");
    map.whenPopupShown("rome", reports.closed);
    map.popupClosed("rome");
    map.popupFor("rome");
    map.whenPopupShown("rome", reports.replaced);
    map.popupFor("park");
    map.whenPopupShown("park", reports.removed);
    map.removed(["park"]);
    expect(Object.values(reports).map((report) => report.mock.calls.length)).toEqual([1, 1, 1]);
  });

  it("reports a failure as the core reports the page's code failing", () => {
    const { session: map, report } = session(card);
    const cause = new Error("no card");
    map.failed("rome", "popupContent", cause);
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "invalid-input",
        message: 'location "rome": popupContent threw',
        locationId: "rome",
        field: "popupContent",
        cause,
      }),
    );
  });
});

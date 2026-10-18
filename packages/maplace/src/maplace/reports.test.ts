import { describe, expect, it } from "vitest";
import { MaplaceError } from "../errors";
import { MAPLACE_EVENT_NAME_LIST } from "../events";
import type { Location } from "../location";
import type { ResolvedPopupOptions } from "../popup";
import { createInternalState } from "../state/state";
import { createLoadStates } from "./load";
import { createReadiness } from "./ready";
import { createReports } from "./reports";

const locations: Location[] = [
  { id: "a", lat: 0, lng: 0, editable: true },
  { id: "b", lat: 1, lng: 1 },
];

function reportsFor(openOn: ResolvedPopupOptions["openOn"] = "click") {
  const state = createInternalState({ locations, selectedId: "a" });
  const loadStates = createLoadStates(state, createReadiness());
  const events: unknown[] = [];
  for (const name of MAPLACE_EVENT_NAME_LIST) {
    state.store.on(name, (payload) => events.push({ [name]: payload }));
  }
  return { store: state.store, events, reports: createReports({ state, loadStates, openOn }) };
}

describe("createReports", () => {
  it("commits each report as the store's own change", () => {
    const { store, events, reports } = reportsFor();
    store.setRoute({ stops: ["a", "b"] });
    reports.reportSelectionChange("b");
    reports.reportHoverChange("a");
    reports.reportLocationChange("a", { type: "marker", lat: 5, lng: 6 });
    const viewport = {
      center: { lat: 0, lng: 0 },
      zoom: 3,
      bounds: { south: -1, west: -1, north: 1, east: 1 },
    };
    reports.reportViewportChange(viewport);
    const leg = { from: "a", to: "b", distanceMeters: 9, durationSeconds: 9, steps: [] };
    reports.reportRouteChange({ legs: [leg], distanceMeters: 9, durationSeconds: 9, path: [] });
    const failure = new MaplaceError("route-failed", "no route");
    reports.reportError(failure);
    expect(store.getSnapshot()).toMatchObject({
      selectedId: "b",
      hoveredId: "a",
      viewport,
      routeResult: { distanceMeters: 9 },
    });
    expect(store.getSnapshot().locations[0]).toMatchObject({ lat: 5, lng: 6 });
    expect(events.map((event) => Object.keys(event as object)[0])).toEqual([
      "selectionChange",
      "hoverChange",
      "locationChange",
      "viewportChange",
      "routeChange",
      "error",
    ]);
  });

  it("reports a live edit as locationEdit, keeping the snapshot", () => {
    const { store, events, reports } = reportsFor();
    const before = store.getSnapshot();
    let notified = 0;
    store.subscribe(() => notified++);
    const geometry = { type: "marker", lat: 5, lng: 6 } as const;
    reports.reportLocationEdit("a", geometry);
    expect(store.getSnapshot()).toBe(before);
    expect(events).toEqual([{ locationEdit: { location: before.locations[0], geometry } }]);
    expect(notified).toBe(0);
  });

  it("reports a click on the map as mapClick, then the selection cleared", () => {
    const { store, events, reports } = reportsFor();
    reports.reportMapClick({ lat: 1, lng: 2 });
    expect(store.getSnapshot().selectedId).toBeUndefined();
    expect(events).toEqual([
      { mapClick: { position: { lat: 1, lng: 2 } } },
      { selectionChange: { id: undefined } },
    ]);
  });

  it("passes the store's openOn to popup close", () => {
    const click = reportsFor("click");
    click.reports.reportPopupClose("a");
    expect(click.store.getSnapshot().selectedId).toBeUndefined();
    const hover = reportsFor("hover");
    hover.reports.reportPopupOpen("a", {} as HTMLElement);
    hover.reports.reportPopupClose("a");
    expect(hover.store.getSnapshot().selectedId).toBe("a");
    expect(hover.events).toEqual([
      { popupOpen: { id: "a", element: {} } },
      { popupClose: { id: "a" } },
    ]);
  });

  it("lets a malformed report throw, for the host to rethrow later", () => {
    const { store, reports } = reportsFor();
    const before = store.getSnapshot();
    expect(() => reports.reportLocationChange("b", { type: "marker", lat: 0, lng: 0 })).toThrow(
      "editable is not true",
    );
    expect(() => reports.reportLocationEdit("b", { type: "marker", lat: 0, lng: 0 })).toThrow(
      "editable is not true",
    );
    expect(() => reports.reportMapClick({ lat: 200, lng: 0 })).toThrow("reportMapClick: position");
    expect(store.getSnapshot()).toBe(before);
  });
});

import { describe, expect, it, vi } from "vitest";
import type { Location } from "../location";
import type { RouteResult } from "../route";
import { mounted } from "../testing/mounted";

// 0.2 scenarios about what comes back from the map (RFC Appendix A, regression-test candidates).

const square = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
  { lat: 1, lng: 1 },
];
const locations: Location[] = [
  { id: "a", lat: 0, lng: 0, editable: true },
  { id: "b", lat: 1, lng: 1 },
  { id: "area", type: "polygon", path: square, editable: true },
  { id: "line", type: "polyline", path: square.slice(0, 2), editable: true },
];

/** A computed route from a to b, told apart by its distance. */
function routeOf(distanceMeters: number): RouteResult {
  const leg = { from: "a", to: "b", distanceMeters, durationSeconds: 60, steps: [] };
  return { legs: [leg], distanceMeters, durationSeconds: 60, path: [] };
}

describe("#64, #164, #178: editing shapes never throws and always reports", () => {
  it("writes back a polygon with an inserted vertex and a dragged polyline", async () => {
    const { maplace, host } = await mounted({ locations });
    const onLocationChange = vi.fn();
    maplace.on("locationChange", onLocationChange);
    const inserted = [...square, { lat: 0.5, lng: 0 }];
    host.reportLocationChange("area", { type: "polygon", path: inserted });
    host.reportLocationChange("line", { type: "polyline", path: inserted.slice(2) });
    const paths = onLocationChange.mock.calls.map(([{ location }]) => location.path);
    expect(paths).toEqual([inserted, inserted.slice(2)]);
  });
});

describe("#127: clicks on the map reach the page after load", () => {
  it("fires selectionChange for each click that changes the selection", async () => {
    const { maplace, host } = await mounted({ locations });
    const onSelectionChange = vi.fn();
    maplace.on("selectionChange", onSelectionChange);
    host.reportSelectionChange("a");
    host.reportSelectionChange("b");
    host.reportSelectionChange("b");
    expect(onSelectionChange.mock.calls).toEqual([[{ id: "a" }], [{ id: "b" }]]);
  });
  it("fires mapClick with where, for every click on the map", async () => {
    const { maplace, host } = await mounted({ locations });
    const onMapClick = vi.fn();
    maplace.on("mapClick", onMapClick);
    host.reportMapClick({ lat: 1, lng: 2 });
    host.reportMapClick({ lat: 1, lng: 2 });
    host.reportMapClick({ lat: 3, lng: 4 });
    expect(onMapClick.mock.calls.map(([{ position }]) => position)).toEqual([
      { lat: 1, lng: 2 },
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
    ]);
  });
});

describe("#137: popupClose fires on close, not on reopen", () => {
  it("fires popupOpen on each open and popupClose only when closed", async () => {
    const { maplace, host } = await mounted({ locations });
    const events: string[] = [];
    maplace.on("popupOpen", () => events.push("open"));
    maplace.on("popupClose", () => events.push("close"));
    const element = {} as HTMLElement;
    host.reportPopupOpen("a", element);
    host.reportPopupOpen("a", element);
    host.reportPopupClose("a");
    expect(events).toEqual(["open", "open", "close"]);
  });
});

describe("#147: the routeChange event carries the result, once per result", () => {
  it("reports each computed route with its data, after a stop is dragged too", async () => {
    const { maplace, host } = await mounted({ locations });
    const distances: (number | undefined)[] = [];
    maplace.on("routeChange", ({ result }) => distances.push(result?.distanceMeters));
    maplace.setRoute({ stops: ["a", "b"] });
    host.reportRouteChange(routeOf(100));
    maplace.setRoute({ stops: ["a", "b"] });
    host.reportLocationChange("a", { type: "marker", lat: 0.5, lng: 0.5 });
    host.reportRouteChange(routeOf(80));
    expect(distances).toEqual([100, 80]);
  });
});

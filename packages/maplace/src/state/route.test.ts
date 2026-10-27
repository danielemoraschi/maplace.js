import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import type { RouteResult } from "../route";
import type { Snapshot } from "../store";
import { NO_CHANGE } from "./change";
import { pruneRoute, setRoute } from "./route";

const at = { lat: 0, lng: 0 };
const RESULT: RouteResult = { legs: [], distanceMeters: 1, durationSeconds: 1, path: [] };

function snapshotOf(ids: string[], fields: Partial<Snapshot> = {}): Snapshot {
  return {
    locations: Object.freeze(ids.map((id): Location => ({ id, ...at }))),
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

const ABC = snapshotOf(["a", "b", "c"]);
const routed = (fields: Partial<Snapshot> = {}): Snapshot => ({
  ...ABC,
  route: { stops: ["a", "b"], travelMode: "walking" },
  routeResult: RESULT,
  ...fields,
});

describe("setRoute", () => {
  it("sets a frozen copy of the route", () => {
    const stops = ["a", "b"];
    const { patch, events } = setRoute(ABC, {
      stops,
      travelMode: "walking",
      style: { stroke: "red" },
    });
    expect(patch.route).toEqual({ stops, travelMode: "walking", style: { stroke: "red" } });
    expect(patch.route?.stops).not.toBe(stops);
    expect(Object.isFrozen(patch.route)).toBe(true);
    expect(Object.isFrozen(patch.route?.stops)).toBe(true);
    expect(events).toEqual([]);
  });

  it("changes nothing for an equal route: same stops in order, travel mode and style fields", () => {
    const current = routed({ route: { stops: ["a", "b"], style: { stroke: "red" } } });
    expect(setRoute(current, { stops: ["a", "b"], style: { stroke: "red" } })).toBe(NO_CHANGE);
  });

  it("clears the result when the stops or travel mode change", () => {
    expect(setRoute(routed(), { stops: ["b", "a"], travelMode: "walking" })).toMatchObject({
      patch: { routeResult: undefined },
      events: [{ name: "routeChange", payload: { result: undefined } }],
    });
    expect(setRoute(routed(), { stops: ["a", "b"] }).patch).toHaveProperty(
      "routeResult",
      undefined,
    );
  });

  it("keeps the result when only the style changes", () => {
    const change = setRoute(routed(), {
      stops: ["a", "b"],
      travelMode: "walking",
      style: { stroke: "red" },
    });
    expect(change.patch).not.toHaveProperty("routeResult");
    expect(change.events).toEqual([]);
  });

  it("clears the route and its result with undefined", () => {
    expect(setRoute(routed(), undefined)).toEqual({
      patch: { route: undefined, routeResult: undefined },
      events: [{ name: "routeChange", payload: { result: undefined } }],
    });
    expect(setRoute(ABC, undefined)).toBe(NO_CHANGE);
  });

  it("rejects a stop that names no location, before counting the stops", () => {
    expect(() => setRoute(ABC, { stops: ["zz"] })).toThrow(
      expect.objectContaining({
        code: "unknown-id",
        message: 'setRoute: route.stops[0] must name a location, got "zz"',
        locationId: "zz",
        field: "route.stops[0]",
      }),
    );
  });

  it("rejects fewer than two stops", () => {
    expect(() => setRoute(ABC, { stops: ["a"] })).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: "setRoute: route.stops must name at least 2 locations, got 1",
        field: "route.stops",
      }),
    );
  });

  it("sets a frozen copy of the stops passed through", () => {
    const via = ["b"];
    const { patch } = setRoute(ABC, { stops: ["a", "b", "c"], via });
    expect(patch.route?.via).toEqual(via);
    expect(patch.route?.via).not.toBe(via);
    expect(Object.isFrozen(patch.route?.via)).toBe(true);
  });

  it("rejects a via id that isn't a stop between the first and the last", () => {
    for (const id of ["a", "zz"]) {
      expect(() => setRoute(ABC, { stops: ["a", "b", "c"], via: [id] })).toThrow(
        expect.objectContaining({
          code: "invalid-input",
          message: `setRoute: route.via[0] must name a stop between the first and the last, got "${id}"`,
          field: "route.via[0]",
        }),
      );
    }
  });

  it("clears the result when only the stops passed through change", () => {
    const current = routed({ route: { stops: ["a", "b", "c"] } });
    expect(setRoute(current, { stops: ["a", "b", "c"], via: ["b"] })).toMatchObject({
      patch: { routeResult: undefined },
      events: [{ name: "routeChange", payload: { result: undefined } }],
    });
  });

  it("changes nothing for the same stops passed through, repeated, or none named", () => {
    const current = routed({ route: { stops: ["a", "b", "c", "a"], via: ["b", "c"] } });
    expect(setRoute(current, { stops: ["a", "b", "c", "a"], via: ["c", "b", "b"] })).toBe(
      NO_CHANGE,
    );
    const direct = routed({ route: { stops: ["a", "b", "c"] } });
    expect(setRoute(direct, { stops: ["a", "b", "c"], via: [] })).toBe(NO_CHANGE);
  });

  it("sets a frozen copy of the things avoided", () => {
    const avoid = ["tolls", "ferries"] as const;
    const { patch } = setRoute(ABC, { stops: ["a", "b"], avoid });
    expect(patch.route?.avoid).toEqual(avoid);
    expect(patch.route?.avoid).not.toBe(avoid);
    expect(Object.isFrozen(patch.route?.avoid)).toBe(true);
  });

  it("clears the result when only the things avoided change", () => {
    const current = routed({ route: { stops: ["a", "b"] } });
    expect(setRoute(current, { stops: ["a", "b"], avoid: ["tolls"] })).toMatchObject({
      patch: { routeResult: undefined },
      events: [{ name: "routeChange", payload: { result: undefined } }],
    });
  });

  it("changes nothing for the same things avoided, in another order, repeated, or none named", () => {
    const current = routed({ route: { stops: ["a", "b"], avoid: ["tolls", "ferries"] } });
    expect(setRoute(current, { stops: ["a", "b"], avoid: ["ferries", "tolls", "tolls"] })).toBe(
      NO_CHANGE,
    );
    const direct = routed({ route: { stops: ["a", "b"] } });
    expect(setRoute(direct, { stops: ["a", "b"], avoid: [] })).toBe(NO_CHANGE);
  });

  it("rejects a bad shape", () => {
    expect(() => setRoute(ABC, { stops: ["a", "b"], travelMode: "flying" } as never)).toThrow(
      /^setRoute: route\.travelMode must be one of/,
    );
  });
});

describe("pruneRoute", () => {
  it("changes nothing while every stop exists", () => {
    expect(pruneRoute(routed())).toBe(NO_CHANGE);
    expect(pruneRoute(ABC)).toBe(NO_CHANGE);
  });

  it("drops stops whose location is gone and clears the result", () => {
    const current = {
      ...routed({ route: { stops: ["a", "b", "c"] } }),
      locations: Object.freeze([
        { id: "a", ...at },
        { id: "c", ...at },
      ]),
    };
    expect(pruneRoute(current)).toEqual({
      patch: { route: { stops: ["a", "c"] }, routeResult: undefined },
      events: [{ name: "routeChange", payload: { result: undefined } }],
    });
    expect(Object.hasOwn(pruneRoute(current).patch.route ?? {}, "via")).toBe(false);
  });

  it("drops via ids that are no longer stops between the first and the last", () => {
    const route = { stops: ["a", "b", "c"], via: ["b"] };
    const without = (gone: string) => ({
      ...routed({ route }),
      locations: Object.freeze(
        ["a", "b", "c"].filter((id) => id !== gone).map((id) => ({ id, ...at })),
      ),
    });
    expect(pruneRoute(without("c")).patch).toEqual({
      route: { stops: ["a", "b"], via: [] },
      routeResult: undefined,
    });
    expect(pruneRoute(without("b")).patch).toEqual({
      route: { stops: ["a", "c"], via: [] },
      routeResult: undefined,
    });
  });

  it("clears the route below two stops", () => {
    const current = { ...routed(), locations: Object.freeze([{ id: "a", ...at }]) };
    expect(pruneRoute(current).patch).toEqual({ route: undefined, routeResult: undefined });
  });
});

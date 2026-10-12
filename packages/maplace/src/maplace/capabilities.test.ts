import { describe, expect, it } from "vitest";
import type { Capability } from "../adapter";
import type { Location } from "../location";
import { initialSnapshot } from "../state/initial";
import type { Snapshot } from "../store";
import { child, root } from "../validate/fail";
import { checkCluster, createSupportCheck } from "./capabilities";

const field = (label: string, ...path: string[]) => path.reduce(child, root(label));

const marker: Location = { id: "a", lat: 0, lng: 0 };
const circle: Location = { id: "c", type: "circle", center: { lat: 0, lng: 0 }, radius: 10 };

function limits(capabilities: Capability[], routeStopLimit?: number) {
  return { capabilities: new Set(capabilities), routeStopLimit };
}

function snapshotWith(patch: Partial<Snapshot>): Snapshot {
  return { ...initialSnapshot(undefined), ...patch };
}

describe("createSupportCheck", () => {
  it("names the location and field a missing capability is needed for", () => {
    const check = createSupportCheck(limits([]));
    expect(() => check(snapshotWith({ locations: [marker, circle] }), "setLocations")).toThrow(
      expect.objectContaining({
        code: "unsupported-capability",
        locationId: "c",
        field: "type",
        message: `location "c": type needs the circle capability, which this map's adapter lacks`,
      }),
    );
    const editable: Location = { ...marker, editable: true };
    expect(() => check(snapshotWith({ locations: [editable] }), "setLocations")).toThrow(
      expect.objectContaining({ code: "unsupported-capability", field: "editable" }),
    );
  });

  it("needs the route capability for a route, and at most routeStopLimit stops", () => {
    const route = { stops: ["a", "b", "c"] };
    expect(() => createSupportCheck(limits([]))(snapshotWith({ route }), "setRoute")).toThrow(
      "setRoute: route needs the route capability, which this map's adapter lacks",
    );
    expect(() =>
      createSupportCheck(limits(["route"], 2))(snapshotWith({ route }), "setRoute"),
    ).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: "setRoute: route.stops must name at most 2 locations, got 3",
      }),
    );
  });

  it("checks a part only when it changed", () => {
    const check = createSupportCheck(limits([]));
    const locations = [circle];
    expect(() => check(snapshotWith({ locations }), "setLocations")).toThrow();
    const passed = snapshotWith({ locations: [marker] });
    check(passed, "setLocations");
    expect(() => check({ ...passed, selectedId: "a" }, "select")).not.toThrow();
  });

  it("accepts everything an adapter with every capability can draw", () => {
    const check = createSupportCheck(limits(["circle", "edit", "route"]));
    const snapshot = snapshotWith({
      locations: [circle, { ...marker, editable: true }],
      route: { stops: ["a", "c"] },
    });
    expect(() => check(snapshot, "attach")).not.toThrow();
  });
});

describe("checkCluster", () => {
  it("needs the cluster capability", () => {
    expect(() => checkCluster(limits([]), field("attach", "options", "cluster"))).toThrow(
      "attach: options.cluster needs the cluster capability, which this map's adapter lacks",
    );
    expect(() => checkCluster(limits(["cluster"]), field("attach"))).not.toThrow();
  });
});

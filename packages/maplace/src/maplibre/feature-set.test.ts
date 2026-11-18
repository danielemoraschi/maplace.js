import type { GeoJSONSourceDiff } from "maplibre-gl";
import { describe, expect, it } from "vitest";
import { createFeatureSet, type LocationFeature, type LocationProperties } from "./feature-set";

/** A map with one GeoJSON source recording what it is sent. */
function mapWithSource() {
  const diffs: GeoJSONSourceDiff[] = [];
  const source = {
    updateData: (diff: GeoJSONSourceDiff) => {
      diffs.push(diff);
      return Promise.resolve();
    },
  };
  return { map: { getSource: () => source } as never, diffs };
}

const point = (lng: number): GeoJSON.Point => ({ type: "Point", coordinates: [lng, 0] });

const feature = (geometry: GeoJSON.Geometry, properties: Partial<LocationProperties> = {}) =>
  ({
    type: "Feature",
    geometry,
    properties: { key: "a", id: "a", rank: 1, ...properties },
  }) as LocationFeature;

describe("createFeatureSet", () => {
  it("adds a feature first sent, and sends an update after: its geometry and the properties changed", () => {
    const { map, diffs } = mapWithSource();
    const set = createFeatureSet(map, "s");
    const first = feature(point(0));
    set.put(first);
    void set.flush();
    const moved = feature(point(1), { stroke: "#ff0000" });
    set.put(moved);
    void set.flush();
    expect(diffs[0]).toEqual({ add: [first], update: [], remove: [] });
    expect(diffs[1]?.update).toEqual([
      {
        id: "a",
        newGeometry: moved.geometry,
        removeProperties: [],
        addOrUpdateProperties: [{ key: "stroke", value: "#ff0000" }],
      },
    ]);
  });

  it("sends what changed since the last flush, a reshape kept through a later restyle", () => {
    const { map, diffs } = mapWithSource();
    const set = createFeatureSet(map, "s");
    set.put(feature(point(0), { fill: "#00ff00" }));
    void set.flush();
    const reshaped = feature(point(2));
    set.put(reshaped);
    set.restyle({ key: "a", id: "a", rank: 1, stroke: "#ff0000" });
    void set.flush();
    const [update] = diffs[1]?.update ?? [];
    expect(update?.newGeometry).toBe(reshaped.geometry);
    expect(update?.removeProperties).toEqual(["fill"]);
  });

  it("sends nothing for a feature put and removed between flushes", () => {
    const { map, diffs } = mapWithSource();
    const set = createFeatureSet(map, "s");
    set.put(feature(point(0)));
    set.remove("a");
    void set.flush();
    expect(diffs).toEqual([{ add: [], update: [], remove: [] }]);
  });
});

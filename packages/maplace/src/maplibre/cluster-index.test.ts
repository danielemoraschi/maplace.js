import { describe, expect, it } from "vitest";
import type { MarkerGeometry } from "../geometry";
import { manyMarkers, TOWNS } from "../testing/conformance/fixtures";
import { type ClusterPoint, indexClusters } from "./cluster-index";

const TOWN_POINTS: ClusterPoint[] = [
  { id: "a", at: TOWNS.bologna },
  { id: "b", at: TOWNS.modena },
  { id: "c", at: TOWNS.ferrara },
];

const sortedIds = (ids: Iterable<string>) => [...ids].sort((a, b) => a.localeCompare(b));

describe("indexClusters", () => {
  it("groups the three towns into one cluster of three at zoom 3, each alone at zoom 17", () => {
    const index = indexClusters(TOWN_POINTS);
    const grouped = index.groupsAt(3);
    expect(grouped.clusters.map(({ count }) => count)).toEqual([3]);
    expect(grouped.alone.size).toBe(0);
    const zoomedIn = index.groupsAt(17);
    expect(zoomedIn.clusters).toEqual([]);
    expect(sortedIds(zoomedIn.alone)).toEqual(["a", "b", "c"]);
  });

  it("puts every point in one place only", () => {
    const points = manyMarkers(400).map(({ id, geometry }) => ({
      id,
      at: geometry as MarkerGeometry,
    }));
    const index = indexClusters(points);
    for (let zoom = 1; zoom <= 16; zoom++) {
      const { clusters, alone } = index.groupsAt(zoom);
      const counted = clusters.reduce((sum, { count }) => sum + count, 0);
      expect(counted + alone.size, `zoom ${zoom}`).toBe(points.length);
    }
  });

  it("splits a cluster at its expansion zoom", () => {
    const index = indexClusters(TOWN_POINTS);
    const [cluster] = index.groupsAt(3).clusters;
    if (cluster === undefined) throw new Error("the towns form no cluster at zoom 3");
    const splitAt = index.expansionZoom(cluster.id);
    expect(splitAt).toBeGreaterThan(3);
    const split = index.groupsAt(splitAt);
    expect(split.clusters.every(({ count }) => count < 3)).toBe(true);
    expect(index.groupsAt(splitAt - 1).clusters.map(({ count }) => count)).toEqual([3]);
  });

  it("groups nothing when given no points", () => {
    const { clusters, alone } = indexClusters([]).groupsAt(3);
    expect(clusters).toEqual([]);
    expect(alone.size).toBe(0);
  });
});

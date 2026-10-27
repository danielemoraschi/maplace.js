// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { CLUSTER_CLASS } from "../adapter-kit/cluster-badge";
import { lookIn } from "../adapter-kit/presentation-changes";
import { presented } from "../testing/conformance/fixtures";
import { clusteredMarkers } from "./clustered-markers";
import {
  clusterersMade,
  type MarkerClusterer,
  type SuperClusterViewportAlgorithm,
} from "./testing/stub-clusterer";
import { clusterOf } from "./testing/stub-clusters";
import { StubMap, StubMarker, stubLibraries } from "./testing/stub-libraries";

vi.mock("@googlemaps/markerclusterer", () => import("./testing/stub-clusterer"));

type Marker = google.maps.marker.AdvancedMarkerElement;

const lookOf = (state: Parameters<typeof presented>[0]) => lookIn(presented(state), "a");
const SHOWN = lookOf({});
const HOVERED = lookOf({ hoveredId: "a" });
const SELECTED = lookOf({ selectedId: "a" });
const HIDDEN = lookOf({ hiddenIds: new Set(["a"]) });

function onClusteredLayer() {
  const map = new StubMap(document.createElement("div")) as unknown as google.maps.Map;
  const layer = clusteredMarkers(map, stubLibraries());
  const clusterer = clusterersMade[clusterersMade.length - 1] as MarkerClusterer;
  const marker = new StubMarker() as unknown as Marker;
  return { map, layer, clusterer, marker };
}

describe("clusteredMarkers", () => {
  it("clusters shown markers, rendering once per flush and only after a change", () => {
    const { layer, clusterer, marker } = onClusteredLayer();
    const other = new StubMarker() as unknown as Marker;
    layer.place(marker, SHOWN);
    layer.place(other, SHOWN);
    expect(clusterer.render).not.toHaveBeenCalled();
    layer.flush();
    layer.place(marker, HOVERED);
    layer.flush();
    expect(clusterer.held()).toEqual([marker, other]);
    expect(clusterer.render).toHaveBeenCalledOnce();
  });

  it("clusters again once a clustered marker moved, every position read anew", () => {
    const { layer, clusterer, marker } = onClusteredLayer();
    const algorithm = clusterer.options.algorithm as SuperClusterViewportAlgorithm;
    layer.place(marker, SHOWN);
    layer.flush();
    layer.moved(marker);
    expect(algorithm.positionsRead()).toEqual([]);
    layer.flush();
    expect(clusterer.render).toHaveBeenCalledTimes(2);
  });

  it("clusters nothing again when a marker not in a cluster moved", () => {
    const { layer, clusterer, marker } = onClusteredLayer();
    layer.place(marker, SELECTED);
    layer.flush();
    layer.moved(marker);
    layer.flush();
    expect(clusterer.render).toHaveBeenCalledOnce();
  });

  it("clusters nothing again when the selected marker is hidden", () => {
    const { layer, clusterer, marker } = onClusteredLayer();
    layer.place(marker, SELECTED);
    layer.flush();
    layer.place(marker, HIDDEN);
    layer.flush();
    expect(clusterer.render).toHaveBeenCalledOnce();
    expect(marker.map).toBeNull();
  });

  it("takes a hidden marker out of every cluster, and off the map", () => {
    const { map, layer, clusterer, marker } = onClusteredLayer();
    marker.map = map;
    layer.place(marker, SHOWN);
    layer.place(marker, HIDDEN);
    layer.flush();
    expect(clusterer.held()).toEqual([]);
    expect(marker.map).toBeNull();
  });

  it("stands the selected marker alone on the map after every render, until deselected", () => {
    const { map, layer, clusterer, marker } = onClusteredLayer();
    layer.place(marker, SHOWN);
    layer.place(marker, SELECTED);
    layer.flush();
    expect(clusterer.held()).toEqual([]);
    expect(marker.map).toBe(map);
    // A render of the clusterer's own, on `idle`, takes it off: it is put back.
    marker.map = null;
    clusterer.render();
    expect(marker.map).toBe(map);
    layer.place(marker, SHOWN);
    layer.flush();
    expect(clusterer.held()).toEqual([marker]);
  });

  it("takes a marker no longer selected off the map when the clusterer draws it in no cluster", () => {
    const { map, layer, marker } = onClusteredLayer();
    layer.place(marker, SELECTED);
    layer.flush();
    expect(marker.map).toBe(map);
    // Deselected away from the view: no cluster the render draws holds it.
    layer.place(marker, SHOWN);
    layer.flush();
    expect(marker.map).toBeNull();
  });

  it("takes the marker selected before off the map, whichever is placed first", () => {
    const { map, layer, marker } = onClusteredLayer();
    const other = new StubMarker() as unknown as Marker;
    layer.place(marker, SELECTED);
    layer.flush();
    layer.place(other, lookIn(presented({ selectedId: "b" }), "b"));
    layer.place(marker, SHOWN);
    layer.flush();
    expect(marker.map).toBeNull();
    expect(other.map).toBe(map);
  });

  it("leaves a marker no longer selected on the map when the clusterer draws it on its own", () => {
    const { map, layer, clusterer, marker } = onClusteredLayer();
    layer.place(marker, SELECTED);
    layer.flush();
    clusterer.clusters = [{ markers: [marker] }];
    layer.place(marker, SHOWN);
    layer.flush();
    expect(marker.map).toBe(map);
  });

  it("lets a removed marker go", () => {
    const { map, layer, clusterer, marker } = onClusteredLayer();
    layer.place(marker, SELECTED);
    layer.flush();
    layer.remove(marker);
    layer.flush();
    expect(clusterer.held()).toEqual([]);
    expect(marker.map).toBeNull();
    clusterer.render();
    expect(marker.map).not.toBe(map);
  });

  it("clusters nothing more and leaves the map on release", () => {
    const { layer, clusterer, marker } = onClusteredLayer();
    layer.place(marker, SELECTED);
    layer.flush();
    layer.release();
    expect(clusterer.held()).toEqual([]);
    expect(clusterer.setMap).toHaveBeenCalledWith(null);
    marker.map = null;
    clusterer.render();
    expect(marker.map).toBeNull();
  });

  it("leaves the clusterer no cluster marker to take off after a render", () => {
    const { layer, clusterer, marker } = onClusteredLayer();
    const [inCluster, alone] = [new StubMarker(), new StubMarker()] as unknown as Marker[];
    const clusterMarker = new StubMarker() as unknown as Marker;
    clusterer.clusters = [
      { markers: [marker, inCluster as Marker], marker: clusterMarker },
      { markers: [alone as Marker], marker: alone as Marker },
    ];
    layer.place(marker, SHOWN);
    layer.flush();
    expect(clusterer.clusters.map((cluster) => cluster.marker)).toEqual([undefined, alone]);
  });

  it("takes the cluster markers off on release", () => {
    const { map, layer, clusterer } = onClusteredLayer();
    const drawn = clusterer.options.renderer?.render(
      clusterOf(2, [1, 2]),
      {} as never,
      map,
    ) as Marker;
    drawn.map = map;
    clusterer.render();
    layer.release();
    expect(drawn.map).toBeNull();
  });

  it("gives the map's document the cluster badges' styles", () => {
    onClusteredLayer();
    const rules = document.adoptedStyleSheets.flatMap((sheet) => [...sheet.cssRules]);
    expect(rules.some((rule) => rule.cssText.includes(`.${CLUSTER_CLASS}`))).toBe(true);
  });

  it("gives the clusterer no click of its own: each cluster listens for its own", () => {
    const { clusterer } = onClusteredLayer();
    expect(clusterer.options.onClusterClick).toBeNull();
  });
});

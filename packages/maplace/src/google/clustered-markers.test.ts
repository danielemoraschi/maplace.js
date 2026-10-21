// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { lookIn } from "../adapter-kit/presentation-changes";
import { presented } from "../testing/conformance/fixtures";
import { clusteredMarkers } from "./clustered-markers";
import {
  clusterersMade,
  type MarkerClusterer,
  type SuperClusterAlgorithm,
} from "./testing/stub-clusterer";
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
    const algorithm = clusterer.options.algorithm as SuperClusterAlgorithm;
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

  it("gives the clusterer no click of its own: each cluster listens for its own", () => {
    const { clusterer } = onClusteredLayer();
    expect(clusterer.options.onClusterClick).toBeNull();
  });
});

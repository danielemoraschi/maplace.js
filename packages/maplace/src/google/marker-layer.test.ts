// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { presented } from "../testing/conformance/fixtures";
import { clusteredMarkers } from "./clustered-markers";
import { directMarkers, loadMarkerLayer } from "./marker-layer";
import { lookIn } from "./presenting";
import { StubMap, StubMarker, stubLibraries } from "./testing/stub-libraries";

afterEach(() => {
  vi.doUnmock("./clustered-markers");
});

type Marker = google.maps.marker.AdvancedMarkerElement;

const SHOWN = lookIn(presented({}), "a");
const HIDDEN = lookIn(presented({ hiddenIds: new Set(["a"]) }), "a");

function onDirectLayer() {
  const map = new StubMap(document.createElement("div")) as unknown as google.maps.Map;
  const layer = directMarkers(map, stubLibraries());
  const marker = new StubMarker() as unknown as Marker;
  return { map, layer, marker };
}

describe("directMarkers", () => {
  it("puts each marker on the map, hiding it there by its look", () => {
    const { map, layer, marker } = onDirectLayer();
    layer.place(marker, SHOWN);
    expect(marker.map).toBe(map);
    expect(marker.hidden).toBe(false);
    layer.place(marker, HIDDEN);
    expect(marker.map).toBe(map);
    expect(marker.hidden).toBe(true);
  });

  it("takes a removed marker off the map", () => {
    const { layer, marker } = onDirectLayer();
    layer.place(marker, SHOWN);
    layer.remove(marker);
    expect(marker.map).toBeNull();
  });
});

describe("loadMarkerLayer", () => {
  it("gives the plain layer without clustering, and the clustered one with it", async () => {
    expect(await loadMarkerLayer(false)).toBe(directMarkers);
    expect(await loadMarkerLayer(true)).toBe(clusteredMarkers);
  });

  it("fails the load when clustering can't be loaded", async () => {
    vi.resetModules();
    vi.doMock("./clustered-markers", () => {
      throw new Error("offline");
    });
    const { loadMarkerLayer: loadAnew } = await import("./marker-layer");
    await expect(loadAnew(true)).rejects.toMatchObject({
      code: "provider-load-failed",
      message: "attach: maplace's clustering failed to load",
    });
  });
});

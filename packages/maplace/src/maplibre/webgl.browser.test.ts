import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import { TEST_STYLE } from "./testing/test-style";

// MapLibre draws with WebGL: without it in the test browser, every MapLibre test would fail for
// a reason of the machine's, so this says so first, and plainly.
describe("the browser tests' MapLibre", () => {
  const maps: MapLibreMap[] = [];
  afterEach(() => {
    for (const map of maps.splice(0)) {
      const container = map.getContainer();
      map.remove();
      container.remove();
    }
  });

  it("has WebGL2 in Chromium", () => {
    const context = document.createElement("canvas").getContext("webgl2");
    expect(context, "headless Chromium gives no WebGL2 context").not.toBeNull();
  });

  it("loads the test style and draws a GeoJSON point through its worker", async () => {
    const maplibregl = await import("maplibre-gl");
    const container = document.createElement("div");
    container.style.cssText = "width: 256px; height: 256px";
    document.body.append(container);
    const map = new maplibregl.Map({ container, style: TEST_STYLE, center: [0, 0], zoom: 1 });
    maps.push(map);
    await map.once("load");
    map.addSource("point", {
      type: "geojson",
      data: { type: "Point", coordinates: [0, 0] },
    });
    map.addLayer({ id: "point", type: "circle", source: "point" });
    await map.once("idle");
    const drawn = map.queryRenderedFeatures(map.project([0, 0]), { layers: ["point"] });
    expect(drawn).toHaveLength(1);
  });
});

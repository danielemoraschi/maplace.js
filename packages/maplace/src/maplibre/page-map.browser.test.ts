import type { TransformStyleFunction } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adding, markerDrawable, polygonDrawable } from "../testing/conformance/fixtures";
import { startMount, unmountAll } from "../testing/conformance/harness";
import { LOCATION_LAYERS, OWN_SOURCES, PIN_SOURCE, SHAPE_SOURCE } from "./layers";
import { PIN_IMAGE } from "./pin-image";
import { mountedOnPageMap } from "./testing/mounted";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";
import { maplibreParts, removePageMaps } from "./testing/subject";
import { TEST_STYLE } from "./testing/test-style";

afterEach(() => {
  unmountAll();
  removePageMaps();
});

/** A page's `transformStyle` keeping maplace's sources and layers through its restyle. */
const keepingMaplace: TransformStyleFunction = (previous, next) => ({
  ...next,
  sources: { ...next.sources, ...previous?.sources },
  layers: [...next.layers, ...(previous?.layers ?? []).filter(({ id }) => isLocationLayer(id))],
});
const isLocationLayer = (id: string) => (LOCATION_LAYERS as readonly string[]).includes(id);

/** A page's map maplace drew on, destroyed while a restyle keeping maplace's was under way. */
async function destroyedMidRestyle() {
  const { map, adapter, destroy } = await mountedOnPageMap();
  await adapter.apply(adding(markerDrawable("a")));
  map.setStyle(TEST_STYLE, { diff: false, transformStyle: keepingMaplace });
  destroy();
  return map;
}

describe("MapLibre on the page's own map", () => {
  it("leaves the map as the page made it: no source, layer, pin image or marker of maplace's", async () => {
    const { map, adapter, destroy } = await mountedOnPageMap();
    const icon = document.createElement("span");
    await adapter.apply(
      adding(markerDrawable("a"), markerDrawable("b", undefined, { renderIcon: () => icon })),
    );
    // There before destroy: their absence after is destroy's doing.
    for (const layer of LOCATION_LAYERS) expect(map.getLayer(layer)).toBeDefined();
    expect(map.hasImage(PIN_IMAGE)).toBe(true);
    expect(icon.isConnected).toBe(true);
    destroy();
    for (const source of [PIN_SOURCE, SHAPE_SOURCE]) expect(map.getSource(source)).toBeUndefined();
    for (const layer of LOCATION_LAYERS) expect(map.getLayer(layer)).toBeUndefined();
    expect(map.hasImage(PIN_IMAGE)).toBe(false);
    expect(icon.isConnected).toBe(false);
  });

  it("is destroyed after the page removed its map first", async () => {
    const { map, adapter, destroy } = await mountedOnPageMap();
    const icon = document.createElement("span");
    await adapter.apply(
      adding(markerDrawable("a"), markerDrawable("b", undefined, { renderIcon: () => icon })),
    );
    map.remove();
    expect(destroy).not.toThrow();
    expect(icon.isConnected).toBe(false);
  });

  it.for([true, false])("keeps maplace's locations through a restyle (diff: %s)", async (diff) => {
    const { map, adapter, probe } = await mountedOnPageMap();
    await adapter.apply(adding(markerDrawable("a"), polygonDrawable("p")));
    const restyled = {
      ...TEST_STYLE,
      layers: [{ ...TEST_STYLE.layers[0], paint: {} }],
    } as typeof TEST_STYLE;
    map.setStyle(restyled, { diff });
    // A style loaded anew takes its time, more under a busy run.
    await vi.waitFor(async () => {
      await probe.settle();
      expect(renderedIds(map, ["maplace-pins"])).toEqual(["a"]);
      expect(renderedIds(map, ["maplace-fills"])).toEqual(["p"]);
    }, RENDER_WAIT);
  });

  it("reports a failure on maplace's own source to the host", async () => {
    const { map, host } = await mountedOnPageMap();
    map.fire("error", { error: new Error("worker failed"), sourceId: PIN_SOURCE });
    expect(host.reportsOf("reportError")).toEqual([
      [expect.objectContaining({ code: "provider-load-failed" })],
    ]);
  });

  it("takes off what a restyle under way kept of maplace's, once the new style is in", async () => {
    const map = await destroyedMidRestyle();
    await map.once("style.load");
    for (const layer of LOCATION_LAYERS) expect(map.getLayer(layer)).toBeUndefined();
    for (const source of OWN_SOURCES) expect(map.getSource(source)).toBeUndefined();
  });

  it("keeps the layers of a map mounted again on the page's map while the restyle was under way", async () => {
    const map = await destroyedMidRestyle();
    const again = startMount({
      name: "maplibre again on the page's map",
      create: () => maplibreParts({ map }),
    });
    await again.mounting;
    await again.adapter.apply(adding(markerDrawable("b")));
    for (const layer of LOCATION_LAYERS) expect(map.getLayer(layer)).toBeDefined();
    await vi.waitFor(() => expect(renderedIds(map, ["maplace-pins"])).toEqual(["b"]), RENDER_WAIT);
  });
});

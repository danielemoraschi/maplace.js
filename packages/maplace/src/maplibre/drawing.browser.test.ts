import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SELECTED_LOOK } from "../adapter-kit/shape-looks";
import type { LocationState } from "../location";
import {
  adding,
  LARGE_DIFF,
  manyMarkers,
  markerDrawable,
  ORIGIN,
  polygonDrawable,
  polylineDrawable,
  presented,
  reshaped,
  squareAround,
  updating,
} from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { LOCATION_LAYERS, PIN_SOURCE, SHAPE_SOURCE } from "./layers";
import { PIN_IMAGE } from "./pin-image";
import { mountedMapLibre, mountedOnPageMap } from "./testing/mounted";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";
import { removePageMaps } from "./testing/subject";
import { TEST_STYLE } from "./testing/test-style";

afterEach(() => {
  unmountAll();
  removePageMaps();
});

/** An icon only while selected: the marker is a pin the rest of the time. */
const iconWhenSelected = (node: Node) => (state: LocationState) =>
  state.selected ? node : undefined;

/** The properties of the first area MapLibre renders. */
const renderedFill = (map: MapLibreMap) =>
  map.queryRenderedFeatures({ layers: ["maplace-fills"] })[0]?.properties;

describe("MapLibre's drawing", () => {
  it("draws a marker with no icon as a pin, one with an icon as a DOM marker", async () => {
    const { state, adapter, probe, container } = await mountedMapLibre();
    const icon = document.createElement("span");
    await adapter.apply(
      adding(markerDrawable("a"), markerDrawable("b", undefined, { renderIcon: () => icon })),
    );
    expect(state.features?.pins.featureOf("a")).toBeDefined();
    expect(probe.location("a")).toMatchObject({ visible: true, icon: undefined });
    expect(probe.location("b")?.icon).toBe(icon);
    expect(container.contains(icon)).toBe(true);
  });

  it("moves a marker between the pin layer and the DOM as its icon comes and goes", async () => {
    const { state, adapter, probe } = await mountedMapLibre();
    const icon = document.createElement("span");
    await adapter.apply(
      adding(markerDrawable("a", undefined, { renderIcon: iconWhenSelected(icon) })),
    );
    adapter.present(presented({ selectedId: "a" }));
    expect(probe.location("a")?.icon).toBe(icon);
    expect(state.features?.pins.featureOf("a")).toBeUndefined();
    adapter.present(presented({}));
    expect(probe.location("a")).toMatchObject({ visible: true, icon: undefined });
    expect(icon.isConnected).toBe(false);
    expect(state.features?.pins.featureOf("a")).toBeDefined();
  });

  it("draws the selected pin again in the DOM, above every other, letting the pointer through", async () => {
    const { adapter, container, state } = await mountedMapLibre();
    await adapter.apply(adding(markerDrawable("a"), markerDrawable("b")));
    const frontPins = () => [
      ...container.querySelectorAll<HTMLImageElement>("img.maplibregl-marker"),
    ];
    expect(frontPins()).toEqual([]);
    adapter.present(presented({ selectedId: "a" }));
    const [front] = frontPins();
    expect(front?.style.pointerEvents).toBe("none");
    // Stacked by its rank among the DOM's markers, as the probe ranks it.
    expect(front?.style.zIndex).toBe(String(state.placed.get("a")?.rank()));
    // The layer of every pin is left as it was: selecting lays out nothing again.
    expect(state.features?.pins.featureOf("a")?.properties.rank).toBe(1);
    adapter.present(presented({}));
    expect(frontPins()).toEqual([]);
  });

  it("draws a shape in its state's style, sent as its properties alone", async () => {
    const { map, adapter, probe } = await mountedMapLibre();
    await adapter.apply(adding(polygonDrawable("p")));
    adapter.present(presented({ selectedId: "p" }));
    await vi.waitFor(async () => {
      await probe.settle();
      expect(renderedFill(map)?.fillOpacity).toBe(SELECTED_LOOK.fillOpacity);
    }, RENDER_WAIT);
    adapter.present(presented({}));
    await vi.waitFor(async () => {
      await probe.settle();
      const fill = renderedFill(map);
      expect(fill).toBeDefined();
      expect(fill?.fillOpacity).toBeUndefined();
    }, RENDER_WAIT);
  });

  it("draws a shape reshaped after a state change in its latest style", async () => {
    const { map, adapter, probe } = await mountedMapLibre();
    await adapter.apply(adding(polygonDrawable("p")));
    // A restyle and a reshape in a row: MapLibre merges diffs sent while one is in its worker.
    adapter.present(presented({ hoveredId: "p" }));
    adapter.present(presented({}));
    const square = { type: "polygon", path: squareAround(ORIGIN, 1) } as const;
    await adapter.apply(updating(reshaped(polygonDrawable("p"), square)));
    await vi.waitFor(async () => {
      await probe.settle();
      const fill = renderedFill(map);
      expect(fill).toBeDefined();
      expect(fill?.fillOpacity).toBeUndefined();
      expect(fill?.strokeWidth).toBeUndefined();
    }, RENDER_WAIT);
  });

  it("renders the pins, DOM markers and shapes the probe reports", async () => {
    const { map, adapter, probe } = await mountedMapLibre();
    const icon = document.createElement("span");
    const withIcon = markerDrawable("b", { lat: 1, lng: 1 }, { renderIcon: () => icon });
    await adapter.apply(
      adding(markerDrawable("a"), withIcon, polylineDrawable("l"), polygonDrawable("p")),
    );
    await probe.settle();
    expect(renderedIds(map, ["maplace-pins"])).toEqual(["a"]);
    expect(renderedIds(map, ["maplace-lines"])).toEqual(["l"]);
    expect(renderedIds(map, ["maplace-fills"])).toEqual(["p"]);
    expect(icon.isConnected).toBe(true);
    expect(probe.locationIds()).toEqual(["a", "b", "l", "p"]);
  });
});

describe("MapLibre's apply", () => {
  it("resolves after destroy, however large the diff", async () => {
    const { adapter, destroy } = await mountedMapLibre();
    const applying = adapter.apply(adding(...manyMarkers(LARGE_DIFF)));
    destroy();
    await expect(applying).resolves.toBeUndefined();
  });

  it("resolves on a map that repaints every frame, which never idles", async () => {
    const { map, adapter } = await mountedOnPageMap();
    map.repaint = true;
    const hung = new Promise((resolve) => setTimeout(() => resolve("hung"), 10_000));
    await expect(
      Promise.race([adapter.apply(adding(markerDrawable("a"))), hung]),
    ).resolves.toBeUndefined();
  });
});

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
});

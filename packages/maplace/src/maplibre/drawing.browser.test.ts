import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SELECTED_LOOK } from "../adapter-kit/shape-looks";
import { frames } from "../google/frames";
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
import { mountedMapLibre, mountedOnPageMap } from "./testing/mounted";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";
import { removePageMaps } from "./testing/subject";

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
    await vi.waitFor(async () => {
      await probe.settle();
      expect(renderedIds(map, ["maplace-pins"])).toEqual(["a"]);
      expect(renderedIds(map, ["maplace-lines"])).toEqual(["l"]);
      expect(renderedIds(map, ["maplace-fills"])).toEqual(["p"]);
    }, RENDER_WAIT);
    expect(icon.isConnected).toBe(true);
    expect(probe.locationIds()).toEqual(["a", "b", "l", "p"]);
  });

  it("settles only once the map has drawn what it was still loading", async () => {
    const { map, probe } = await mountedMapLibre();
    await probe.settle();
    // As while a source's worker still holds data sent without a wait (a restyle, a selection).
    const loading = vi.spyOn(map, "loaded").mockReturnValue(false);
    let settled = false;
    const settling = probe.settle().then(() => {
      settled = true;
    });
    await frames(5);
    expect(settled).toBe(false);
    loading.mockRestore();
    map.triggerRepaint();
    const released = performance.now();
    await settling;
    // Well before the settle's own 3 s timeout: it waited for the map's idle, not for the clock.
    expect(performance.now() - released).toBeLessThan(2000);
  });

  it("draws a page's icon node at the size its page gave it (0.2 dropped icon width and height)", async () => {
    const { adapter } = await mountedMapLibre();
    const icon = document.createElement("div");
    icon.style.cssText = "width: 40px; height: 30px";
    await adapter.apply(adding(markerDrawable("a", undefined, { renderIcon: () => icon })));
    const { width, height } = icon.getBoundingClientRect();
    expect({ width, height }).toEqual({ width: 40, height: 30 });
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

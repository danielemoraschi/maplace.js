import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adding,
  markerDrawable,
  presented,
  TOWNS,
  updating,
} from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { toMapLibreZoom } from "./conversions";
import { HEAT_DOTS_LAYER, HEAT_LAYER, PIN_SOURCE } from "./layers";
import { mountedMapLibre, mountedOnPageMap } from "./testing/mounted";
import { RENDER_WAIT } from "./testing/rendered";
import { removePageMaps } from "./testing/subject";
import { TEST_STYLE } from "./testing/test-style";

afterEach(() => {
  unmountAll();
  removePageMaps();
});

const QUAKES = [
  markerDrawable("a", TOWNS.bologna, { heatWeight: 4 }),
  markerDrawable("b", TOWNS.modena, { heatWeight: 2 }),
];
const VOLCANO = markerDrawable("v", TOWNS.ferrara);

/** A MapLibre map with heat below zoom 9: two quakes in the heat and a volcano pin, over them. */
const HEATED = { heatmap: { maxZoom: 9 } };

async function heatedMap() {
  const mounted = await mountedMapLibre(undefined, HEATED);
  mounted.adapter.setView({ kind: "center", center: TOWNS.bologna, zoom: 3 });
  await mounted.adapter.apply(adding(...QUAKES, VOLCANO));
  await mounted.probe.settle();
  return mounted;
}

const pinProperties = (state: Awaited<ReturnType<typeof heatedMap>>["state"], id: string) =>
  state.features?.pins.featureOf(id)?.properties;

/** The heat layer's weight expression's divisor: the heaviest heat marker's weight. */
const heaviestIn = (map: Awaited<ReturnType<typeof heatedMap>>["map"]) =>
  (map.getPaintProperty(HEAT_LAYER, "heatmap-weight") as unknown[])[2];

describe("a heatmap on MapLibre", () => {
  it("draws the heat group as heat and the other markers as pins", async () => {
    const { map, state } = await heatedMap();
    expect(pinProperties(state, "a")).toMatchObject({ heat: 4 });
    expect(pinProperties(state, "v")).not.toHaveProperty("heat");
    expect(map.getLayer(HEAT_LAYER)?.source).toBe(PIN_SOURCE);
    expect(map.getLayer(HEAT_DOTS_LAYER)?.source).toBe(PIN_SOURCE);
  });

  it("crossfades over the 2 zooms below maxZoom: heat until 9, dots from 7", async () => {
    const { map } = await heatedMap();
    expect(map.getLayer(HEAT_LAYER)?.maxzoom).toBe(toMapLibreZoom(9));
    expect(map.getLayer(HEAT_DOTS_LAYER)?.minzoom).toBe(toMapLibreZoom(7));
  });

  it("weighs against the heaviest heat marker, after a diff", async () => {
    const { adapter, map, probe } = await heatedMap();
    expect(heaviestIn(map)).toBe(4);
    await adapter.apply(updating(markerDrawable("b", TOWNS.modena, { heatWeight: 8 })));
    await probe.settle();
    expect(heaviestIn(map)).toBe(8);
  });

  it("takes a click on a dot as its location's", async () => {
    const { adapter, probe, host } = await heatedMap();
    adapter.setView({ kind: "center", center: TOWNS.modena, zoom: 12 });
    await probe.settle();
    probe.click("b");
    await probe.settle();
    expect(host.reportsOf("reportSelectionChange")).toEqual([["b"]]);
  });

  it("keeps the selected heat marker's pin in the pin layer, so it takes a click at world zoom", async () => {
    const { adapter, probe, state, host } = await heatedMap();
    adapter.present(presented({ selectedId: "a" }));
    await probe.settle();
    expect(pinProperties(state, "a")).toMatchObject({ heat: 4, front: true });
    probe.click("a");
    await probe.settle();
    expect(host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
  });

  it("takes a filtered-out heat marker out of the heat", async () => {
    const { adapter, probe, state } = await heatedMap();
    adapter.present(presented({ hiddenIds: new Set(["a"]) }));
    await probe.settle();
    expect(pinProperties(state, "a")).toBeUndefined();
  });

  it("draws a marker leaving the heat group as a pin", async () => {
    const { adapter, probe, state } = await heatedMap();
    await adapter.apply(updating(markerDrawable("b", TOWNS.modena)));
    await probe.settle();
    expect(pinProperties(state, "b")).not.toHaveProperty("heat");
  });

  it("keeps the heat, and its weights, through a page's restyle", async () => {
    const { adapter, map, probe } = await mountedOnPageMap(HEATED);
    await adapter.apply(adding(...QUAKES, VOLCANO));
    await probe.settle();
    map.setStyle({ ...TEST_STYLE, layers: [{ ...TEST_STYLE.layers[0], paint: {} }] } as never, {
      diff: false,
    });
    await vi.waitFor(async () => {
      await probe.settle();
      expect(map.getLayer(HEAT_LAYER)).toBeDefined();
      expect(heaviestIn(map)).toBe(4);
    }, RENDER_WAIT);
  });

  it("keeps a heat marker in the heat when the page draws every marker's icon (React's markerIcon)", async () => {
    const { adapter, probe, state } = await heatedMap();
    const renderIcon = () => document.createElement("b");
    await adapter.apply(adding(markerDrawable("r", TOWNS.bologna, { heatWeight: 1, renderIcon })));
    await probe.settle();
    expect(pinProperties(state, "r")).toMatchObject({ heat: 1 });
    const placed = state.placed.get("r");
    expect(placed && "domMarker" in placed ? placed.domMarker() : undefined).toBeUndefined();
  });

  it("moves a marker with the page's icon into the heat, and out to its icon again", async () => {
    const { adapter, probe, state } = await heatedMap();
    const renderIcon = () => document.createElement("b");
    const domMarkerOf = (id: string) => {
      const placed = state.placed.get(id);
      return placed && "domMarker" in placed ? placed.domMarker() : undefined;
    };
    await adapter.apply(adding(markerDrawable("r", TOWNS.bologna, { renderIcon })));
    await adapter.apply(
      updating(markerDrawable("r", TOWNS.bologna, { renderIcon, heatWeight: 1 })),
    );
    await probe.settle();
    expect(pinProperties(state, "r")).toMatchObject({ heat: 1 });
    expect(domMarkerOf("r")).toBeUndefined();
    await adapter.apply(updating(markerDrawable("r", TOWNS.bologna, { renderIcon })));
    await probe.settle();
    expect(pinProperties(state, "r")).toBeUndefined();
    expect(domMarkerOf("r")).toBeDefined();
  });

  it("adds no heat layer to a map without a heatmap", async () => {
    const { map } = await mountedMapLibre();
    expect(map.getLayer(HEAT_LAYER)).toBeUndefined();
    expect(map.getLayer(HEAT_DOTS_LAYER)).toBeUndefined();
  });
});

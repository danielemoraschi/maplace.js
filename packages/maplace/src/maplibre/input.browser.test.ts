import { Marker as MapLibreMarker } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DOUBLE_CLICK_WAIT_MS } from "../adapter-kit/click-gesture";
import {
  adding,
  markerDrawable,
  ORIGIN,
  polygonDrawable,
  presented,
  squareAround,
} from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { mountedMapLibre, mountedOnPageMap } from "./testing/mounted";
import { clickCanvas } from "./testing/pointer";
import { removePageMaps } from "./testing/subject";

afterEach(() => {
  unmountAll();
  removePageMaps();
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("input on MapLibre", () => {
  it("takes a click on a DOM marker for the location's, never a click on the map", async () => {
    const { adapter, probe, host } = await mountedMapLibre();
    const icon = document.createElement("span");
    icon.style.cssText = "display: block; width: 20px; height: 20px";
    await adapter.apply(adding(markerDrawable("a", undefined, { renderIcon: () => icon })));
    icon.click();
    await wait(DOUBLE_CLICK_WAIT_MS * 2);
    expect(host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
    expect(host.reportsOf("reportMapClick")).toEqual([]);
    await probe.settle();
  });

  it("selects a DOM marker with Enter or Space, as a button", async () => {
    const { adapter, host } = await mountedMapLibre();
    const icon = document.createElement("span");
    await adapter.apply(adding(markerDrawable("a", undefined, { renderIcon: () => icon })));
    const marker = icon.parentElement;
    for (const key of ["Enter", " "]) marker?.dispatchEvent(new KeyboardEvent("keydown", { key }));
    expect(host.reportsOf("reportSelectionChange")).toEqual([["a"], ["a"]]);
  });

  it("reports one hover moving from a pin onto a DOM marker", async () => {
    const { state, adapter, probe, host } = await mountedMapLibre();
    const icon = document.createElement("span");
    const far = { lat: 10, lng: 20 };
    await adapter.apply(
      adding(markerDrawable("pin"), markerDrawable("dom", far, { renderIcon: () => icon })),
    );
    // Pointed at once drawn: a busy run can take longer than apply waits for.
    await vi.waitFor(() => {
      const drawn = state.mounted?.map.queryRenderedFeatures({ layers: ["maplace-pins"] });
      expect(drawn).toHaveLength(1);
    });
    probe.pointerOver("pin");
    probe.pointerOver("dom");
    expect(host.reportsOf("reportHoverChange")).toEqual([["pin"], ["dom"]]);
  });

  it("doesn't take a pin hidden this tick for a click on it", async () => {
    const { state, adapter, probe, host } = await mountedMapLibre();
    await adapter.apply(adding(markerDrawable("a")));
    await probe.settle();
    const map = state.mounted?.map;
    if (map === undefined) throw new Error("the map is open");
    adapter.present(presented({ hiddenIds: new Set(["a"]) }));
    // MapLibre still draws the pin until its next frame: a click there now is on the map.
    clickCanvas(map, { at: ORIGIN, up: 30 });
    expect(host.reportsOf("reportSelectionChange")).toEqual([]);
  });

  it("selects the smaller polygon where a bigger one's outline, drawn above it, crosses it", async () => {
    const { state, adapter, probe, host } = await mountedMapLibre();
    const big = polygonDrawable("big", {
      geometry: { type: "polygon", path: squareAround(ORIGIN, 4) },
    });
    const onBigEdge = { lat: 0, lng: 2 };
    const small = polygonDrawable("small", {
      geometry: { type: "polygon", path: squareAround(onBigEdge, 1) },
    });
    await adapter.apply(adding(big, small));
    adapter.setView({ kind: "center", center: onBigEdge, zoom: 7 });
    await probe.settle();
    const map = state.mounted?.map;
    if (map === undefined) throw new Error("the map is open");
    clickCanvas(map, { at: { lat: 0.2, lng: 2 } });
    expect(host.reportsOf("reportSelectionChange")).toEqual([["small"]]);
  });

  it("keeps the hover of a pin that becomes its DOM marker under the pointer", async () => {
    const { adapter, probe, host, container } = await mountedMapLibre();
    const icon = document.createElement("span");
    const iconWhenHovered = (state: { readonly hovered: boolean }) =>
      state.hovered ? icon : undefined;
    await adapter.apply(adding(markerDrawable("a", undefined, { renderIcon: iconWhenHovered })));
    await vi.waitFor(() => expect(container.querySelector("canvas")).not.toBeNull());
    probe.pointerOver("a");
    adapter.present(presented({ hoveredId: "a" }));
    const marker = icon.parentElement;
    if (marker === null) throw new Error("the hovered pin is its DOM marker");
    const canvas = container.querySelector("canvas");
    // The pointer, now over the marker: it enters it, leaves the canvas for it, moves on it.
    marker.dispatchEvent(new PointerEvent("pointerenter"));
    canvas?.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: marker }));
    marker.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"]]);
  });

  it("ends a pin's hover when the pointer moves onto one of the page's own markers", async () => {
    const { map, adapter, probe, host } = await mountedOnPageMap();
    await adapter.apply(adding(markerDrawable("a")));
    await vi.waitFor(() =>
      expect(map.queryRenderedFeatures({ layers: ["maplace-pins"] })).toHaveLength(1),
    );
    const own = document.createElement("div");
    new MapLibreMarker({ element: own }).setLngLat([20, 10]).addTo(map);
    probe.pointerOver("a");
    own.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"], [undefined]]);
  });
});

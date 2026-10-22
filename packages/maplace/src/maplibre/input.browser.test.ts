import { type Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DOUBLE_CLICK_WAIT_MS } from "../adapter-kit/click-gesture";
import {
  AWAY,
  adding,
  markerDrawable,
  ORIGIN,
  polygonDrawable,
  presented,
  squareAround,
} from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { wait } from "./testing/map-settle";
import { mountedMapLibre, mountedOnPageMap } from "./testing/mounted";
import { clickCanvas, moveOverCanvas } from "./testing/pointer";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";
import { removePageMaps } from "./testing/subject";

afterEach(() => {
  unmountAll();
  removePageMaps();
});

/** Waits for MapLibre to render `ids`' pins: a busy run can take longer than apply waits for. */
async function pinsRendered(map: MapLibreMap, ...ids: string[]): Promise<void> {
  await vi.waitFor(() => expect(renderedIds(map, ["maplace-pins"])).toEqual(ids), RENDER_WAIT);
}

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
    const { map, adapter, probe, host } = await mountedMapLibre();
    const icon = document.createElement("span");
    await adapter.apply(
      adding(markerDrawable("pin"), markerDrawable("dom", AWAY, { renderIcon: () => icon })),
    );
    await pinsRendered(map, "pin");
    probe.pointerOver("pin");
    probe.pointerOver("dom");
    expect(host.reportsOf("reportHoverChange")).toEqual([["pin"], ["dom"]]);
  });

  it("doesn't take a pin hidden this tick for a click on it", async () => {
    const { map, adapter, host } = await mountedMapLibre();
    await adapter.apply(adding(markerDrawable("a")));
    await pinsRendered(map, "a");
    const onPin = { at: ORIGIN, up: 30 };
    clickCanvas(map, onPin);
    expect(host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
    adapter.present(presented({ hiddenIds: new Set(["a"]) }));
    // MapLibre still draws the pin until its next frame: a click there now is on the map.
    expect(renderedIds(map, ["maplace-pins"])).toEqual(["a"]);
    clickCanvas(map, onPin);
    await wait(DOUBLE_CLICK_WAIT_MS * 2);
    expect(host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
    expect(host.reportsOf("reportMapClick")).toHaveLength(1);
  });

  it("doesn't take a pin folded into a cluster this tick for a click on it", async () => {
    const { map, adapter, host } = await mountedMapLibre(undefined, { cluster: true });
    adapter.present(presented({ selectedId: "b" }));
    await adapter.apply(adding(markerDrawable("a"), markerDrawable("b")));
    await pinsRendered(map, "a", "b");
    adapter.present(presented({}));
    // Both fold into one cluster, though MapLibre still draws their pins until its next frame.
    expect(renderedIds(map, ["maplace-pins"])).toEqual(["a", "b"]);
    clickCanvas(map, { at: ORIGIN, up: 30 });
    await wait(DOUBLE_CLICK_WAIT_MS * 2);
    expect(host.reportsOf("reportSelectionChange")).toEqual([]);
    expect(host.reportsOf("reportMapClick")).toHaveLength(1);
  });

  it("leaves the cursor a page sets on its own map while the pointer is on no location", async () => {
    const { map } = await mountedOnPageMap();
    map.getCanvas().style.cursor = "crosshair";
    moveOverCanvas(map, { at: AWAY });
    moveOverCanvas(map, { at: AWAY });
    expect(map.getCanvas().style.cursor).toBe("crosshair");
  });

  it("selects the smaller polygon where a bigger one's outline, drawn above it, crosses it", async () => {
    const { map, adapter, probe, host } = await mountedMapLibre();
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
    clickCanvas(map, { at: { lat: 0.2, lng: 2 } });
    expect(host.reportsOf("reportSelectionChange")).toEqual([["small"]]);
  });

  it("keeps the hover of a pin that becomes its DOM marker under the pointer", async () => {
    const { map, adapter, probe, host } = await mountedMapLibre();
    const icon = document.createElement("span");
    const iconWhenHovered = (state: { readonly hovered: boolean }) =>
      state.hovered ? icon : undefined;
    await adapter.apply(adding(markerDrawable("a", undefined, { renderIcon: iconWhenHovered })));
    await pinsRendered(map, "a");
    probe.pointerOver("a");
    adapter.present(presented({ hoveredId: "a" }));
    const marker = icon.parentElement;
    if (marker === null) throw new Error("the hovered pin is its DOM marker");
    // The pointer, now over the marker: it enters it, leaves the canvas for it, moves on it.
    marker.dispatchEvent(new PointerEvent("pointerenter"));
    const leavingForMarker = new MouseEvent("mouseout", { bubbles: true, relatedTarget: marker });
    map.getCanvas().dispatchEvent(leavingForMarker);
    marker.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"]]);
  });

  it("ends a pin's hover when the pointer moves onto one of the page's own markers", async () => {
    const { map, adapter, probe, host } = await mountedOnPageMap();
    await adapter.apply(adding(markerDrawable("a")));
    await pinsRendered(map, "a");
    const own = document.createElement("div");
    new MapLibreMarker({ element: own }).setLngLat(AWAY).addTo(map);
    probe.pointerOver("a");
    own.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"], [undefined]]);
  });
});

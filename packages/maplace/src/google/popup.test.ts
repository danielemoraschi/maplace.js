// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import type { PresentationState } from "../adapter";
import type { Drawable } from "../drawable";
import type { ResolvedPopupOptions } from "../popup";
import {
  markerDrawable,
  polygonDrawable,
  presented,
  withContent,
} from "../testing/conformance/fixtures";
import { createMapState } from "./map-state";
import { PLACERS } from "./placers";
import { createPlacingSite } from "./placing-site";
import { createPopup } from "./popup";
import type { StubInfoWindow } from "./testing/stub-popups";
import { stubMounted } from "./testing/stub-site";

const ALPHA = withContent(markerDrawable("a"), "Alpha");
const BETA = withContent(markerDrawable("b"), "Beta");

/** Popups on a stub map holding `drawables`, and how a test drives them as the store would. */
function popupsOn(drawables: Drawable[], settings: Partial<ResolvedPopupOptions> = {}) {
  const state = createMapState();
  const { mounted, host, close } = stubMounted(state, settings);
  const site = createPlacingSite(mounted, state);
  for (const drawable of drawables)
    state.placed.set(drawable.id, PLACERS[drawable.geometry.type](drawable, site));
  const popup = createPopup(state);
  popup.part.open(mounted);
  return {
    state,
    host,
    destroy: close,
    present(next: Partial<PresentationState>) {
      state.presented = presented(next);
      popup.sync();
    },
    update(drawable: Drawable) {
      state.placed.get(drawable.id)?.update(drawable);
      popup.sync();
    },
    remove(id: string) {
      state.placed.get(id)?.remove();
      state.placed.delete(id);
      popup.sync();
    },
    /** As a diff with a type change: removed, then placed again as its new type. */
    replace(drawable: Drawable) {
      state.placed.get(drawable.id)?.remove();
      state.placed.set(drawable.id, PLACERS[drawable.geometry.type](drawable, site));
      popup.sync();
    },
    window: () => state.popup?.infoWindow as unknown as StubInfoWindow | undefined,
    /** Google's `domready`, which the stub fires in a microtask. */
    settled: () => new Promise((resolve) => setTimeout(resolve, 0)),
  };
}

/** What the window's last `open` was given. */
const lastOpen = (window: StubInfoWindow | undefined) => window?.opens[window.opens.length - 1];

const opened = (host: ReturnType<typeof popupsOn>["host"]) =>
  host.reportsOf("reportPopupOpen").map(([id, element]) => [id, element.textContent]);

describe("createPopup", () => {
  it("reports the selection's popup open once its content is in the DOM, in its own element", async () => {
    const popups = popupsOn([ALPHA]);
    popups.present({ selectedId: "a" });
    expect(popups.host.reports).toEqual([]);
    await popups.settled();
    const [[id, element]] = popups.host.reportsOf("reportPopupOpen") as [[string, HTMLElement]];
    expect([id, element.textContent, element.isConnected]).toEqual(["a", "Alpha", true]);
  });

  it("closes the last popup for a new selection, each close paired with an open", async () => {
    const popups = popupsOn([ALPHA, BETA]);
    popups.present({ selectedId: "a" });
    await popups.settled();
    popups.present({ selectedId: "b" });
    await popups.settled();
    expect(opened(popups.host)).toEqual([
      ["a", "Alpha"],
      ["b", "Beta"],
    ]);
    expect(popups.host.reportsOf("reportPopupClose")).toEqual([["a"]]);
  });

  it("refreshes new content in place: open reported again, never closed", async () => {
    const popups = popupsOn([ALPHA]);
    popups.present({ selectedId: "a" });
    await popups.settled();
    popups.update(withContent(markerDrawable("a"), "Alpha again"));
    await popups.settled();
    expect(opened(popups.host)).toEqual([
      ["a", "Alpha"],
      ["a", "Alpha again"],
    ]);
    expect(popups.host.reportsOf("reportPopupClose")).toEqual([]);
    expect(popups.window()?.opens).toHaveLength(1);
  });

  it("closes, reported, for a location hidden, removed, or whose new content built nothing", async () => {
    for (const leave of [
      (p: ReturnType<typeof popupsOn>) => p.present({ selectedId: "a", hiddenIds: new Set(["a"]) }),
      (p: ReturnType<typeof popupsOn>) => p.remove("a"),
      (p: ReturnType<typeof popupsOn>) =>
        p.update(markerDrawable("a", undefined, { renderContent: () => undefined })),
    ]) {
      const popups = popupsOn([ALPHA]);
      popups.present({ selectedId: "a" });
      await popups.settled();
      leave(popups);
      expect(popups.host.reportsOf("reportPopupClose")).toEqual([["a"]]);
      expect(popups.window()).toBeUndefined();
    }
  });

  it("keeps a popup the user closed closed, and reports that close", async () => {
    const popups = popupsOn([ALPHA]);
    popups.present({ selectedId: "a" });
    await popups.settled();
    popups.window()?.closeByUser();
    popups.present({ selectedId: "a" });
    expect(popups.host.reportsOf("reportPopupClose")).toEqual([["a"]]);
    expect(popups.state.popup).toBeUndefined();
  });

  it("reports nothing for content a newer popup replaced before it showed", async () => {
    const popups = popupsOn([ALPHA, BETA]);
    popups.present({ selectedId: "a" });
    popups.present({ selectedId: "b" });
    await popups.settled();
    expect(opened(popups.host)).toEqual([["b", "Beta"]]);
    expect(popups.host.reportsOf("reportPopupClose")).toEqual([]);
  });

  it("opens a hover popup without panning or focus, sized and offset as set", async () => {
    const popups = popupsOn([ALPHA], { openOn: "hover", maxWidth: 200, offset: [3, -4] });
    popups.present({ hoveredId: "a" });
    const window = popups.window();
    expect(window?.get("disableAutoPan")).toBe(true);
    expect(window?.get("maxWidth")).toBe(200);
    expect(window?.get("pixelOffset")).toEqual({ width: 3, height: -4 });
    expect(window?.opens[0]?.shouldFocus).toBe(false);
  });

  it("gives a click popup focus only when focus is in the map, as after a click on it", () => {
    const popups = popupsOn([ALPHA]);
    popups.present({ selectedId: "a" });
    expect(popups.window()?.opens[0]?.shouldFocus).toBe(false);
    popups.present({});
    const marker = popups.state.placed.get("a") as unknown as { marker: HTMLElement };
    const mapElement = popups.state.mounted?.map.getDiv() as HTMLElement;
    document.body.append(mapElement);
    mapElement.append(marker.marker);
    marker.marker.tabIndex = 0;
    marker.marker.focus();
    popups.present({ selectedId: "a" });
    expect(lastOpen(popups.window())?.shouldFocus).toBe(true);
  });

  it("points a marker's popup at the marker, and a shape's at its centre", () => {
    const popups = popupsOn([ALPHA, withContent(polygonDrawable("p"), "Pi")]);
    popups.present({ selectedId: "a" });
    expect(popups.window()?.opens[0]?.anchor).toBeTruthy();
    popups.present({ selectedId: "p" });
    expect(lastOpen(popups.window())?.anchor).toBeNull();
    expect(popups.window()?.get("position")).toEqual({ lat: 0, lng: 0 });
  });

  it("moves a shape's popup only when the shape's geometry changes", () => {
    const polygon = withContent(polygonDrawable("p"), "Pi");
    const popups = popupsOn([polygon]);
    popups.present({ selectedId: "p" });
    const setPosition = vi.spyOn(popups.window() as StubInfoWindow, "setPosition");
    popups.present({ selectedId: "p", hoveredId: "p" });
    expect(setPosition).not.toHaveBeenCalled();
    const moved = [
      { lat: 10, lng: 10 },
      { lat: 10, lng: 12 },
      { lat: 12, lng: 12 },
    ];
    popups.update({ ...polygon, geometry: { type: "polygon", path: moved } });
    expect(setPosition).toHaveBeenCalledWith({ lat: 11, lng: 11 });
  });

  it("moves an open popup to its location placed anew, as after a type change, without closing", async () => {
    const popups = popupsOn([ALPHA]);
    popups.present({ selectedId: "a" });
    await popups.settled();
    const window = popups.window();
    popups.replace({ ...ALPHA, geometry: polygonDrawable("a").geometry });
    await popups.settled();
    expect(lastOpen(window)?.anchor).toBeNull();
    expect(window?.get("position")).toEqual({ lat: 0, lng: 0 });
    expect(popups.host.reportsOf("reportPopupClose")).toEqual([]);
    expect(opened(popups.host)).toEqual([
      ["a", "Alpha"],
      ["a", "Alpha"],
    ]);
  });

  it("closes on destroy and reports nothing after", async () => {
    const popups = popupsOn([ALPHA]);
    popups.present({ selectedId: "a" });
    const window = popups.window();
    popups.destroy();
    await Promise.resolve();
    expect(window?.isOpen).toBe(false);
    expect(popups.host.reports).toEqual([]);
  });
});

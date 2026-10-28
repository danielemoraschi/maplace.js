import { afterEach, describe, expect, it } from "vitest";
import type { AdapterHost } from "../adapter";
import type { LocationState } from "../location";
import { adding, markerDrawable, presented, withContent } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { createRecordingHost } from "../testing/conformance/recording-host";
import { sizedContainer } from "../testing/container";
import type { MapLibreState } from "./map-state";
import type { MountedMapLibre } from "./mounted-map";
import { wait } from "./testing/map-settle";
import { mountedMapLibre } from "./testing/mounted";
import { pageMapIn, removePageMaps } from "./testing/subject";
import { viewportReports } from "./viewport-reports";

afterEach(() => {
  unmountAll();
  removePageMaps();
});

describe("MapLibre's viewport reports", () => {
  it("report nothing while the map is hidden, though MapLibre draws it at 400 by 300", async () => {
    const { container, probe, host } = await mountedMapLibre();
    await probe.settle();
    const reportedBefore = host.reportsOf("reportViewportChange").length;
    container.style.display = "none";
    // MapLibre's resize observer, its throttle, and the idle after the resize it makes.
    await wait(300);
    await probe.settle();
    expect(host.reportsOf("reportViewportChange")).toHaveLength(reportedBefore);
  });

  it("report the view of a page's map already still when the adapter opens on it", async () => {
    const container = sizedContainer();
    const map = pageMapIn(container);
    await map.once("idle");
    const host = createRecordingHost();
    const mounted = {
      map,
      live: (): AdapterHost => host,
      onDestroy() {},
    } as unknown as MountedMapLibre;
    viewportReports.open(mounted);
    expect(host.reportsOf("reportViewportChange")).toHaveLength(1);
    container.remove();
  });
});

describe("MapLibre's popups", () => {
  /** A marker near the map's top edge, whose popup opens above it, out of the map. */
  async function popupNearTheTop(openOn: "click" | "hover") {
    const mounted = await mountedMapLibre(undefined, { openOn });
    const { lat, lng } = mounted.map.unproject([256, 40]);
    await mounted.adapter.apply(adding(withContent(markerDrawable("a", { lat, lng }), "Alpha")));
    await mounted.probe.settle();
    return mounted;
  }

  it("open on a click, out of the map, pan the map to bring it in", async () => {
    const { adapter, probe, map } = await popupNearTheTop("click");
    const before = map.getCenter();
    adapter.present(presented({ selectedId: "a" }));
    await probe.settle();
    expect(probe.shownPopup()?.id).toBe("a");
    expect(map.getCenter().lat).toBeGreaterThan(before.lat);
  });

  it("open on hover neither pan the map nor take focus", async () => {
    const { adapter, probe, map, container } = await popupNearTheTop("hover");
    const button = document.createElement("button");
    container.append(button);
    button.focus();
    const before = map.getCenter();
    adapter.present(presented({ hoveredId: "a" }));
    await probe.settle();
    expect(probe.shownPopup()?.id).toBe("a");
    expect(map.getCenter()).toEqual(before);
    expect(document.activeElement).toBe(button);
  });

  it("stack above every marker, below the map's controls and the page's overlays", async () => {
    const { adapter, probe, state, map } = await popupNearTheTop("click");
    adapter.present(presented({ selectedId: "a" }));
    await probe.settle();
    const popup = state.popup?.window.popup.getElement();
    const markers = map.getCanvasContainer();
    // Markers stack by rank among themselves only: the popup, after them, is drawn over them all.
    expect(markers.style.isolation).toBe("isolate");
    expect(popup?.parentElement).toBe(map.getContainer());
    expect(popup && markers.compareDocumentPosition(popup)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(popup?.style.zIndex).toBe("");
  });
});

describe("MapLibre's popups over a page's icon", () => {
  /** An icon of `height` pixels, as a page's image is once it has loaded. */
  function iconOf(height: number): HTMLElement {
    const icon = document.createElement("div");
    icon.style.cssText = `width: 20px; height: ${height}px`;
    return icon;
  }

  /**
   * An icon of `height` pixels whose image hasn't loaded yet; loaded, it takes `loadedHeight`, as an
   * image sized only by its file does, or stays as it is, as one the page sized does.
   */
  function loadingIcon(height: number, loadedHeight = height) {
    const icon = iconOf(height);
    const image = icon.appendChild(document.createElement("img"));
    let loaded = false;
    Object.defineProperty(image, "complete", { get: () => loaded });
    function load(): void {
      loaded = true;
      icon.style.height = `${loadedHeight}px`;
      image.dispatchEvent(new Event("load"));
    }
    return { icon, load };
  }

  /** Alpha selected, drawn by `iconFor`, its popup open. */
  async function selectedWithIcon(iconFor: (state: LocationState) => HTMLElement) {
    const mounted = await mountedMapLibre();
    const alpha = { ...withContent(markerDrawable("a"), "Alpha"), renderIcon: iconFor };
    await mounted.adapter.apply(adding(alpha));
    mounted.adapter.present(presented({ selectedId: "a" }));
    await mounted.probe.settle();
    return mounted;
  }

  /** Where the popup's tip is, from the top of the page. */
  function tipOf(state: MapLibreState): number {
    return state.popup?.window.popup.getElement().getBoundingClientRect().bottom ?? Number.NaN;
  }

  /** How far the popup's tip is above the top of `icon`. */
  const tipAbove = (icon: Element, state: MapLibreState) =>
    icon.getBoundingClientRect().top - tipOf(state);

  it("keeps a popup's tip as far above its marker's icon after the icon grows, as an image loading late does", async () => {
    const icon = iconOf(20);
    const { state } = await selectedWithIcon(() => icon);
    const before = tipAbove(icon, state);
    icon.style.height = "46px";
    await expect.poll(() => tipAbove(icon, state)).toBeCloseTo(before, 0);
  });

  it("keeps the tip above the icon when the popup is reopened on the same marker and the icon grows", async () => {
    const icon = iconOf(20);
    const { adapter, probe, state } = await selectedWithIcon(() => icon);
    const before = tipAbove(icon, state);
    adapter.present(presented({}));
    await probe.settle();
    adapter.present(presented({ selectedId: "a" }));
    await probe.settle();
    icon.style.height = "46px";
    await expect.poll(() => tipAbove(icon, state)).toBeCloseTo(before, 0);
  });

  it("keeps the popup still while its marker's new icon image loads", async () => {
    const shown = iconOf(46);
    const hovered = loadingIcon(20, 46);
    const { adapter, probe, state } = await selectedWithIcon(({ hovered: isHovered }) =>
      isHovered ? hovered.icon : shown,
    );
    const tip = tipOf(state);
    const before = tipAbove(shown, state);
    adapter.present(presented({ selectedId: "a", hoveredId: "a" }));
    await probe.settle();
    // The observer's callbacks run in the frames after the icon changed.
    await wait(100);
    expect(tipOf(state)).toBeCloseTo(tip, 0);
    hovered.load();
    await expect.poll(() => tipAbove(hovered.icon, state)).toBeCloseTo(before, 0);
  });

  it("points the popup at its marker's new icon once its image loads, though the icon's size doesn't change", async () => {
    const shown = iconOf(46);
    const hovered = loadingIcon(30);
    const { adapter, probe, state } = await selectedWithIcon(({ hovered: isHovered }) =>
      isHovered ? hovered.icon : shown,
    );
    const before = tipAbove(shown, state);
    const tip = tipOf(state);
    adapter.present(presented({ selectedId: "a", hoveredId: "a" }));
    await probe.settle();
    // The observer's callbacks run in the frames after the icon changed: the lift held till then.
    await wait(100);
    expect(tipOf(state)).toBeCloseTo(tip, 0);
    hovered.load();
    await expect.poll(() => tipAbove(hovered.icon, state)).toBeCloseTo(before, 0);
  });

  it("keeps the popup's lift when its marker is taken off the page while it is open", async () => {
    const icon = iconOf(46);
    const { state } = await selectedWithIcon(() => icon);
    const tip = tipOf(state);
    (icon.parentElement as HTMLElement).remove();
    // The observer's callbacks run in the frames after the marker went.
    await wait(100);
    expect(tipOf(state)).toBeCloseTo(tip, 0);
  });
});

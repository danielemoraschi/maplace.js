import { afterEach, describe, expect, it } from "vitest";
import type { AdapterHost } from "../adapter";
import { adding, markerDrawable, presented, withContent } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { createRecordingHost } from "../testing/conformance/recording-host";
import type { MountedMapLibre } from "./mounted-map";
import { mountedMapLibre } from "./testing/mounted";
import { pageMapIn, removePageMaps } from "./testing/subject";
import { viewportReports } from "./viewport-reports";

afterEach(() => {
  unmountAll();
  removePageMaps();
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const container = document.createElement("div");
    container.style.cssText = "width: 256px; height: 256px";
    document.body.append(container);
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
    const map = mounted.state.mounted?.map;
    if (map === undefined) throw new Error("the map is open");
    const { lat, lng } = map.unproject([256, 40]);
    await mounted.adapter.apply(adding(withContent(markerDrawable("a", { lat, lng }), "Alpha")));
    await mounted.probe.settle();
    return { ...mounted, map };
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
    const { adapter, probe, state } = await popupNearTheTop("click");
    const map = state.mounted?.map;
    adapter.present(presented({ selectedId: "a" }));
    await probe.settle();
    const popup = state.popup?.window.popup.getElement();
    const markers = map?.getCanvasContainer();
    // Markers stack by rank among themselves only: the popup, after them, is drawn over them all.
    expect(markers?.style.isolation).toBe("isolate");
    expect(popup?.parentElement).toBe(map?.getContainer());
    expect(popup && markers?.compareDocumentPosition(popup)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(popup?.style.zIndex).toBe("");
  });
});

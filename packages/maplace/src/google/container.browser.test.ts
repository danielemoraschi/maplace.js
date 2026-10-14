import { afterEach, expect, it } from "vitest";
import { createMaplace } from "../maplace/create";
import { boxContains } from "../testing/conformance/geo";
import { unmountAll } from "../testing/conformance/harness";
import { sizedContainer } from "../testing/container";
import type { Bounds } from "../viewport";
import { explainCameraOnFailure } from "./testing/camera-timeline";
import { inputOn } from "./testing/map-input";
import { wait } from "./testing/map-waits";
import { centerOf, centredOn, fitted, onGoogle, TILES_TIMEOUT_MS } from "./testing/store-on-google";
import { pageMapIn } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

const ROME = { id: "rome", lat: 41.9, lng: 12.5, title: "Rome" };
const LISBON = { id: "lisbon", lat: 38.72, lng: -9.14, title: "Lisbon" };
/** The box around both: wide, so a narrower map fits it only further out. */
const BOTH: Bounds = { south: LISBON.lat, west: LISBON.lng, north: ROME.lat, east: ROME.lng };

/** A container on the page, hidden as a closed tab hides its content. */
function hiddenContainer(): HTMLElement {
  const container = sizedContainer();
  container.style.display = "none";
  return container;
}

describeWithMaps("Google maps in hidden or resized containers", () => {
  afterEach(unmountAll);

  for (const own of [false, true]) {
    it(`fits a store in a hidden tab once the tab shows (#79)${own ? ", on the page's map" : ""}`, async () => {
      const container = hiddenContainer();
      const map = own ? pageMapIn(container) : undefined;
      const maplace = createMaplace({ locations: [ROME, LISBON] });
      await onGoogle(maplace, { map, container });
      await wait(1000);
      expect(maplace.getSnapshot().viewport).toBeUndefined();
      container.style.display = "";
      // Google reports the view it opens at as it is shown, then the fit once its tiles load.
      await fitted(maplace);
      const bounds = maplace.getSnapshot().viewport?.bounds ?? BOTH;
      expect(boxContains(bounds, BOTH)).toBe(true);
    });
  }

  it("draws a map hidden and shown again at its size, which Google alone often doesn't", async () => {
    const container = sizedContainer();
    const map = pageMapIn(container);
    const maplace = createMaplace({ locations: [ROME, LISBON] });
    await onGoogle(maplace, { map, container });
    await fitted(maplace);
    container.style.display = "none";
    await wait(300);
    container.style.display = "";
    const hasArea = () => {
      const bounds = map.getBounds()?.toJSON();
      return bounds !== undefined && bounds.west !== bounds.east;
    };
    await expect.poll(hasArea, { timeout: 3000 }).toBe(true);
  });

  for (const own of [false, true]) {
    it(`keeps the locations fitted as a side panel takes half the width${own ? ", on the page's map" : ""}`, async () => {
      const container = sizedContainer();
      const map = own ? pageMapIn(container) : undefined;
      const maplace = createMaplace({ locations: [ROME, LISBON] });
      const { googleMap } = await onGoogle(maplace, { map, container });
      await fitted(maplace);
      const shown = googleMap() as google.maps.Map;
      const fittedZoom = shown.getZoom() ?? 0;
      explainCameraOnFailure(shown);
      container.style.width = `${container.offsetWidth / 2}px`;
      // What G10 changes is Google's camera; the store hears of it at Google's `idle`, after tiles.
      await expect
        .poll(() => shown.getZoom(), { timeout: TILES_TIMEOUT_MS })
        .toBeLessThan(fittedZoom);
      expect(boxContains(shown.getBounds()?.toJSON() ?? BOTH, BOTH)).toBe(true);
      const reportedAsShown = () => maplace.getSnapshot().viewport?.zoom === shown.getZoom();
      await expect.poll(reportedAsShown, { timeout: TILES_TIMEOUT_MS }).toBe(true);
    });
  }

  it("keeps the view the user dragged to when the container is resized", async () => {
    const container = sizedContainer();
    const map = pageMapIn(container);
    const maplace = createMaplace({ locations: [ROME, LISBON] });
    await onGoogle(maplace, { map, container });
    await fitted(maplace);
    const input = await inputOn(map);
    const from = centerOf(map);
    await input.drag({ from, to: { lat: from.lat - 2, lng: from.lng + 3 } });
    await expect.poll(() => centredOn(maplace.getSnapshot().viewport?.center, from)).toBe(false);
    const dragged = centerOf(map);
    const zoom = map.getZoom();
    const beforeResize = maplace.getSnapshot().viewport;
    container.style.width = `${container.offsetWidth / 2}px`;
    // The narrower map reports narrower bounds; a re-fit would also move the centre.
    await expect
      .poll(() => maplace.getSnapshot().viewport, { timeout: TILES_TIMEOUT_MS })
      .not.toBe(beforeResize);
    await wait(500);
    expect(centredOn(centerOf(map), dragged)).toBe(true);
    expect(map.getZoom()).toBe(zoom);
  });
});

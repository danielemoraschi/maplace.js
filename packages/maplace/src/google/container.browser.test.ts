import { afterEach, expect, it } from "vitest";
import { createMaplace } from "../maplace/create";
import { boxContains } from "../testing/conformance/geo";
import { unmountAll } from "../testing/conformance/harness";
import { sizedContainer } from "../testing/container";
import type { Bounds } from "../viewport";
import { inputOn } from "./testing/map-input";
import { centerOf, centredOn, onGoogle } from "./testing/store-on-google";
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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Waits for the store's fit of both locations, not the view a map opens at (zoom 1). */
async function fitted(maplace: { getSnapshot(): { viewport?: { zoom: number } | undefined } }) {
  await expect
    .poll(() => maplace.getSnapshot().viewport?.zoom ?? 0, { timeout: 5000 })
    .toBeGreaterThan(2);
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

  it("keeps the locations fitted as a side panel takes half the width", async () => {
    const maplace = createMaplace({ locations: [ROME, LISBON] });
    const { container } = await onGoogle(maplace);
    await fitted(maplace);
    const fittedZoom = maplace.getSnapshot().viewport?.zoom ?? 0;
    container.style.width = `${container.offsetWidth / 2}px`;
    const zoom = () => maplace.getSnapshot().viewport?.zoom;
    await expect.poll(zoom, { timeout: 5000 }).toBeLessThan(fittedZoom);
    const bounds = maplace.getSnapshot().viewport?.bounds ?? BOTH;
    expect(boxContains(bounds, BOTH)).toBe(true);
  });

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
      .poll(() => maplace.getSnapshot().viewport, { timeout: 5000 })
      .not.toBe(beforeResize);
    await wait(500);
    expect(centredOn(centerOf(map), dragged)).toBe(true);
    expect(map.getZoom()).toBe(zoom);
  });
});

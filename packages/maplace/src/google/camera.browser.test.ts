import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import type { Location } from "../location";
import { boundsAround } from "../maplace/bounds";
import { createMaplace } from "../maplace/create";
import { boxContains, FIT_MAX_ZOOM } from "../testing/conformance/geo";
import { unmountAll } from "../testing/conformance/harness";
import { sizedContainer } from "../testing/container";
import type { Bounds, Viewport } from "../viewport";
import { inputOn } from "./testing/map-input";
import { centerOf, centredOn, onGoogle } from "./testing/store-on-google";
import { mountedGoogle, pageMapIn } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

const ROME = { id: "rome", lat: 41.9, lng: 12.5, title: "Rome" };
const OSLO = { id: "oslo", lat: 59.91, lng: 10.75, title: "Oslo" };
const AROUND_ROME = { lat: ROME.lat, lng: ROME.lng };
const WITHIN_5_KM: Location = { id: "near", type: "circle", center: AROUND_ROME, radius: 5000 };
const WITHIN_15_KM: Location = { id: "far", type: "circle", center: AROUND_ROME, radius: 15000 };

describeWithMaps("the Google camera under real input", () => {
  afterEach(unmountAll);

  it("reports a user's drag of the map once, after the release, where it ended", async () => {
    const { adapter, state, host, probe } = await mountedGoogle();
    adapter.setView({ kind: "center", center: { lat: 0, lng: 0 }, zoom: 5 });
    await probe.settle();
    const before = host.reportsOf("reportViewportChange").length;
    const map = state.mounted?.map as google.maps.Map;
    const input = await inputOn(map);
    await input.drag({ from: { lat: 0, lng: 0 }, to: { lat: 3, lng: 4 } });
    await probe.settle();
    const reports = host.reportsOf("reportViewportChange").slice(before);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.[0].center).toEqual(centerOf(map));
    expect(centredOn(reports[0]?.[0].center, { lat: 0, lng: 0 })).toBe(false);
  });

  it("fits a store's one location at the fit cap, centred on it", async () => {
    const { maplace } = await onGoogle(createMaplace({ locations: [ROME] }));
    await expect.poll(() => maplace.getSnapshot().viewport?.zoom).toBe(FIT_MAX_ZOOM);
    expect(centredOn(maplace.getSnapshot().viewport?.center, ROME)).toBe(true);
  });

  it("pans to a marker the user clicks", async () => {
    const { maplace, container } = await onGoogle(createMaplace({ locations: [ROME, OSLO] }));
    await expect.poll(() => maplace.getSnapshot().viewport).toBeDefined();
    const oslo = () =>
      container.querySelector<HTMLElement>('gmp-advanced-marker[aria-label="Oslo"]');
    await expect.poll(() => oslo()?.getBoundingClientRect().width ?? 0).toBeGreaterThan(0);
    await userEvent.click(oslo() as HTMLElement);
    await expect.poll(() => centredOn(maplace.getSnapshot().viewport?.center, OSLO)).toBe(true);
  });

  it("fits a selected circle: the wider one shown further out, each inside the map", async () => {
    const { maplace } = await onGoogle(createMaplace({ locations: [WITHIN_5_KM, WITHIN_15_KM] }));
    await expect.poll(() => maplace.getSnapshot().viewport).toBeDefined();
    const shown = async (circle: Location, previousZoom: number | undefined) => {
      maplace.select(circle.id);
      await expect.poll(() => maplace.getSnapshot().viewport?.zoom).not.toBe(previousZoom);
      const { bounds, zoom } = maplace.getSnapshot().viewport as Viewport;
      expect(boxContains(bounds, boundsAround([circle]) as Bounds)).toBe(true);
      return zoom;
    };
    const near = await shown(WITHIN_5_KM, maplace.getSnapshot().viewport?.zoom);
    const far = await shown(WITHIN_15_KM, near);
    expect(far).toBeLessThan(near);
  });

  it("moves the page's own map to the store's view", async () => {
    const container = sizedContainer();
    const map = pageMapIn(container);
    const { maplace } = await onGoogle(createMaplace({ locations: [ROME] }), { map });
    await expect.poll(() => maplace.getSnapshot().viewport?.zoom).toBe(FIT_MAX_ZOOM);
    expect(map.getZoom()).toBe(FIT_MAX_ZOOM);
    expect(centredOn(centerOf(map), ROME)).toBe(true);
  });
});

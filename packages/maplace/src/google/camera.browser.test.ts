import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createMaplace } from "../maplace/create";
import { FIT_MAX_ZOOM } from "../testing/conformance/geo";
import { unmountAll } from "../testing/conformance/harness";
import { sizedContainer } from "../testing/container";
import { inputOn } from "./testing/map-input";
import { centerOf, centredOn, onGoogle } from "./testing/store-on-google";
import { mountedGoogle, pageMapIn } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

const ROME = { id: "rome", lat: 41.9, lng: 12.5, title: "Rome" };
const OSLO = { id: "oslo", lat: 59.91, lng: 10.75, title: "Oslo" };

describeWithMaps("the Google camera under real input", () => {
  afterEach(unmountAll);

  it("reports a user's drag of the map once, after the release, where it ended", async () => {
    const { adapter, state, host, probe } = await mountedGoogle();
    adapter.setView({ kind: "center", center: { lat: 0, lng: 0 }, zoom: 5 });
    await probe.settle();
    const before = host.reportsOf("reportViewport").length;
    const map = state.mounted?.map as google.maps.Map;
    const input = await inputOn(map);
    await input.drag({ from: { lat: 0, lng: 0 }, to: { lat: 3, lng: 4 } });
    await probe.settle();
    const reports = host.reportsOf("reportViewport").slice(before);
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

  it("moves the page's own map to the store's view", async () => {
    const container = sizedContainer();
    const map = pageMapIn(container);
    const { maplace } = await onGoogle(createMaplace({ locations: [ROME] }), { map });
    await expect.poll(() => maplace.getSnapshot().viewport?.zoom).toBe(FIT_MAX_ZOOM);
    expect(map.getZoom()).toBe(FIT_MAX_ZOOM);
    expect(centredOn(centerOf(map), ROME)).toBe(true);
  });
});

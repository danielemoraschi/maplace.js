// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { mapIdVerdict, VERDICT_WAIT_MS } from "./map-id-verdict";
import { wait } from "./testing/map-waits";
import { sizeable } from "./testing/sized-element";
import type { StubMap } from "./testing/stub-libraries";
import { stubMounted } from "./testing/stub-site";

afterEach(() => {
  vi.useRealTimers();
});

const noMapId = expect.objectContaining({ code: "provider-load-failed", field: "mapId" });

interface PageMapState {
  readonly hidden?: boolean;
  /** Initialised already, as a map Google drew before the adapter came: whether it shows markers. */
  readonly drawnShowingMarkers?: boolean;
}

/** The page's map, shown and not yet initialised unless the state says otherwise. */
function pageMap({ hidden = false, drawnShowingMarkers }: PageMapState = {}) {
  const opened = stubMounted();
  const map = opened.mounted.map as unknown as StubMap;
  sizeable(map.getDiv(), hidden ? 0 : 512, 512);
  if (drawnShowingMarkers === undefined) map.renderingType = "UNINITIALIZED";
  else map.capabilities = { isAdvancedMarkersAvailable: drawnShowingMarkers };
  let settled = false;
  const verdict = mapIdVerdict(opened.mounted).then(() => {
    settled = true;
  });
  const errors = () => opened.host.reportsOf("reportError");
  return { ...opened, map, verdict, errors, settled: () => settled };
}

/** Lets settled promises run their callbacks. */
const flush = () => wait(0);

describe("mapIdVerdict", () => {
  it("settles with nothing to report on a map that can show markers", async () => {
    const { map, verdict, errors } = pageMap();
    map.initialise({ isAdvancedMarkersAvailable: true });
    await verdict;
    expect(errors()).toEqual([]);
  });

  it("waits for Google to initialise the map, then reports a map without a map ID", async () => {
    const { map, verdict, errors, settled } = pageMap();
    await flush();
    expect(settled()).toBe(false);
    map.initialise({ isAdvancedMarkersAvailable: false });
    await verdict;
    expect(errors()).toEqual([[noMapId]]);
  });

  it("settles at once on a map Google already drew, reporting it only without a map ID", async () => {
    const reportsFor = async (drawnShowingMarkers: boolean) => {
      const { verdict, errors } = pageMap({ drawnShowingMarkers });
      await verdict;
      return errors();
    };
    expect(await reportsFor(true)).toEqual([]);
    expect(await reportsFor(false)).toEqual([[noMapId]]);
  });

  it("doesn't hold a hidden map back, and reports once Google initialises it shown", async () => {
    const { map, errors, settled } = pageMap({ hidden: true });
    await flush();
    expect(settled()).toBe(true);
    map.initialise({ isAdvancedMarkersAvailable: false });
    expect(errors()).toEqual([[noMapId]]);
  });

  it("stops waiting after a while, and still reports what Google says later", async () => {
    vi.useFakeTimers();
    const { map, verdict, errors } = pageMap();
    await vi.advanceTimersByTimeAsync(VERDICT_WAIT_MS);
    await verdict;
    map.initialise({ isAdvancedMarkersAvailable: false });
    expect(errors()).toEqual([[noMapId]]);
  });

  it("settles when the map closes, reporting nothing after", async () => {
    const { map, verdict, errors, close } = pageMap();
    close();
    await verdict;
    map.initialise({ isAdvancedMarkersAvailable: false });
    expect(errors()).toEqual([]);
  });

  it("reports at most once", async () => {
    const { map, verdict, errors } = pageMap();
    map.initialise({ isAdvancedMarkersAvailable: false });
    map.initialise({ isAdvancedMarkersAvailable: false });
    await verdict;
    expect(errors()).toEqual([[noMapId]]);
  });
});

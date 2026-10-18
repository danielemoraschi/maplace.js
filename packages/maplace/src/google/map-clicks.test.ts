// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdapterHost } from "../adapter";
import type { LatLng } from "../geometry";
import { createRecordingHost } from "../testing/conformance/recording-host";
import { DOUBLE_CLICK_WAIT_MS, mapClicks, reportLocationClick } from "./map-clicks";
import type { MountedMap } from "./mounted-map";
import { StubMap } from "./testing/stub-libraries";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function openedClicks() {
  const map = new StubMap(document.createElement("div"));
  const host = createRecordingHost();
  const teardowns: (() => void)[] = [];
  let live: AdapterHost | undefined = host;
  const mounted = {
    map,
    live: () => live,
    onDestroy: (teardown: () => void) => teardowns.push(teardown),
  } as unknown as MountedMap;
  mapClicks.open(mounted);
  const clicks = () => host.reportsOf("reportMapClick").map(([position]) => position);
  return { map, mounted, host, clicks, teardowns, stop: () => (live = undefined) };
}

/** A click as Google gives one, its point a `google.maps.LatLng`; the `nth` of a multi-click. */
const clickAt = (point: LatLng, nth?: number) => ({
  latLng: { toJSON: () => point },
  domEvent: nth === undefined ? undefined : new MouseEvent("click", { detail: nth }),
});
const HERE = { lat: 1, lng: 2 };

describe("mapClicks", () => {
  it("reports a single click on the map with where it was, once no double-click can follow", () => {
    const { map, host, clicks } = openedClicks();
    map.trigger("click", clickAt(HERE));
    vi.advanceTimersByTime(DOUBLE_CLICK_WAIT_MS - 1);
    expect(clicks()).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(clicks()).toEqual([HERE]);
    expect(host.reportsOf("reportSelectionChange")).toEqual([]);
  });

  it("reports nothing for a double-click, which Google gives as two clicks and a dblclick", () => {
    const { map, clicks } = openedClicks();
    map.trigger("click", clickAt(HERE));
    vi.advanceTimersByTime(DOUBLE_CLICK_WAIT_MS / 2);
    map.trigger("click", clickAt(HERE));
    map.trigger("dblclick", clickAt(HERE));
    vi.runAllTimers();
    expect(clicks()).toEqual([]);
  });

  it("reports nothing for a triple-click, its third click a later click of one gesture", () => {
    const { map, clicks } = openedClicks();
    map.trigger("click", clickAt(HERE, 1));
    map.trigger("click", clickAt(HERE, 2));
    map.trigger("dblclick", clickAt(HERE, 2));
    map.trigger("click", clickAt(HERE, 3));
    vi.runAllTimers();
    expect(clicks()).toEqual([]);
  });

  it("reports the first click of a gesture only, by its count", () => {
    const { map, clicks } = openedClicks();
    map.trigger("click", clickAt(HERE, 1));
    map.trigger("click", clickAt({ lat: 3, lng: 4 }, 2));
    vi.runAllTimers();
    expect(clicks()).toEqual([HERE]);
  });

  it("drops a held click when a location is clicked after it, the user's last click", () => {
    const { map, mounted, host, clicks } = openedClicks();
    map.trigger("click", clickAt(HERE));
    reportLocationClick(mounted, "a");
    vi.runAllTimers();
    expect(clicks()).toEqual([]);
    expect(host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
  });

  it("reports nothing for a triple-click whose events count no clicks, by their timing", () => {
    const { map, clicks } = openedClicks();
    const gap = DOUBLE_CLICK_WAIT_MS / 2;
    map.trigger("click", clickAt(HERE, 0));
    vi.advanceTimersByTime(gap);
    map.trigger("click", clickAt(HERE, 0));
    map.trigger("dblclick", clickAt(HERE, 0));
    vi.advanceTimersByTime(gap);
    map.trigger("click", clickAt(HERE, 0));
    vi.runAllTimers();
    expect(clicks()).toEqual([]);
  });

  it("reports the first of two quick clicks with no dblclick, the second part of its gesture", () => {
    const { map, clicks } = openedClicks();
    map.trigger("click", clickAt(HERE, 0));
    vi.advanceTimersByTime(DOUBLE_CLICK_WAIT_MS - 1);
    map.trigger("click", clickAt({ lat: 3, lng: 4 }, 0));
    vi.runAllTimers();
    expect(clicks()).toEqual([HERE]);
  });

  it("reports each of two single clicks, the second after the first's hold", () => {
    const { map, clicks } = openedClicks();
    map.trigger("click", clickAt(HERE));
    vi.advanceTimersByTime(DOUBLE_CLICK_WAIT_MS);
    map.trigger("click", clickAt({ lat: 3, lng: 4 }));
    vi.runAllTimers();
    expect(clicks()).toEqual([HERE, { lat: 3, lng: 4 }]);
  });

  it("reports nothing for a click Google can't place", () => {
    const { map, clicks } = openedClicks();
    map.trigger("click", { latLng: null });
    vi.runAllTimers();
    expect(clicks()).toEqual([]);
  });

  it("stops listening on destroy, dropping a click still held", () => {
    const { map, clicks, teardowns } = openedClicks();
    map.trigger("click", clickAt(HERE));
    for (const teardown of teardowns) teardown();
    map.trigger("click", clickAt(HERE));
    vi.runAllTimers();
    expect(clicks()).toEqual([]);
  });

  it("reports nothing once the map stops reporting", () => {
    const { map, clicks, stop } = openedClicks();
    map.trigger("click", clickAt(HERE));
    stop();
    vi.runAllTimers();
    expect(clicks()).toEqual([]);
  });
});

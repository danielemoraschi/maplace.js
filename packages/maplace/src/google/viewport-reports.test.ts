// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { AdapterHost } from "../adapter";
import { createRecordingHost } from "../testing/conformance/recording-host";
import type { MountedMap } from "./mounted-map";
import { sizedElement } from "./testing/sized-element";
import { StubMap } from "./testing/stub-libraries";
import { viewportReports } from "./viewport-reports";

const SHOWN = {
  center: { lat: 1, lng: 180 },
  zoom: 4,
  bounds: { south: -20, west: 160, north: 20, east: -160 },
};

/**
 * The part on a hand-made mounted map whose teardowns and `live()` a test runs apart: a real
 * close would also stop `live()`, hiding a listener left on the map.
 */
function openedReports(drawn?: typeof SHOWN) {
  const { element, size } = sizedElement(512, 512);
  const map = new StubMap(element);
  map.shown = drawn;
  const host = createRecordingHost();
  const teardowns: (() => void)[] = [];
  let live: AdapterHost | undefined = host;
  const mounted = {
    map,
    live: () => live,
    onDestroy: (teardown: () => void) => teardowns.push(teardown),
  } as unknown as MountedMap;
  viewportReports.open(mounted);
  const reported = () => host.reportsOf("reportViewportChange").map(([viewport]) => viewport);
  return { map, size, reported, teardowns, stop: () => (live = undefined) };
}

describe("viewportReports", () => {
  it("reports what the map shows each time it settles, as Google gives it", () => {
    const { map, reported } = openedReports();
    map.shown = SHOWN;
    map.trigger("idle");
    expect(reported()).toEqual([SHOWN]);
  });

  it("reports the view of a map the page already drew as it opens, which no idle would", () => {
    const { reported } = openedReports(SHOWN);
    expect(reported()).toEqual([SHOWN]);
  });

  it("reports nothing while the map has no size, as in a closed tab", () => {
    const { map, size, reported } = openedReports();
    size.width = 0;
    map.shown = SHOWN;
    map.trigger("idle");
    expect(reported()).toEqual([]);
  });

  it("reports nothing for bounds with no area, as Google gives for a map just shown", () => {
    const { map, reported } = openedReports();
    map.shown = { ...SHOWN, bounds: { south: 1, west: 180, north: 1, east: 180 } };
    map.trigger("idle");
    expect(reported()).toEqual([]);
  });

  it("reports nothing before Google has drawn the map", () => {
    const { map, reported } = openedReports();
    map.trigger("idle");
    expect(reported()).toEqual([]);
  });

  it("stops listening on destroy", () => {
    const { map, reported, teardowns } = openedReports();
    map.shown = SHOWN;
    for (const teardown of teardowns) teardown();
    map.trigger("idle");
    expect(reported()).toEqual([]);
  });

  it("reports nothing once the map stops reporting", () => {
    const { map, reported, stop } = openedReports();
    map.shown = SHOWN;
    stop();
    map.trigger("idle");
    expect(reported()).toEqual([]);
  });
});

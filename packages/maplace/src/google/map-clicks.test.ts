// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { AdapterHost } from "../adapter";
import { createRecordingHost } from "../testing/conformance/recording-host";
import { mapClicks } from "./map-clicks";
import type { MountedMap } from "./mounted-map";
import { StubMap } from "./testing/stub-libraries";

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
  const selects = () => host.reportsOf("reportSelectionChange").map(([id]) => id);
  return { map, selects, teardowns, stop: () => (live = undefined) };
}

describe("mapClicks", () => {
  it("reports a click on the map as no location", () => {
    const { map, selects } = openedClicks();
    map.trigger("click");
    expect(selects()).toEqual([undefined]);
  });

  it("stops listening on destroy", () => {
    const { map, selects, teardowns } = openedClicks();
    for (const teardown of teardowns) teardown();
    map.trigger("click");
    expect(selects()).toEqual([]);
  });

  it("reports nothing once the map stops reporting", () => {
    const { map, selects, stop } = openedClicks();
    stop();
    map.trigger("click");
    expect(selects()).toEqual([]);
  });
});

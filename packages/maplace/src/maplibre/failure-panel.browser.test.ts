import { afterEach, describe, expect, it, vi } from "vitest";
import { MAP_FAILURE_CLASS } from "../map-failure-words";
import { unmountAll } from "../testing/conformance/harness";
import { sizedContainer } from "../testing/container";
import { queried } from "../testing/queried";
import { OWN_SOURCES } from "./layers";
import { createMapLibreMap } from "./maplibre-map";
import { mountedMapLibre, mountedOnPageMap, mountingMapLibre } from "./testing/mounted";
import { removePageMaps } from "./testing/subject";

afterEach(() => {
  unmountAll();
  removePageMaps();
  vi.restoreAllMocks();
});

const MISSING = `${location.origin}/maplibre-test-missing/style.json`;
const panelsIn = (container: Element) => container.querySelectorAll(`.${MAP_FAILURE_CLASS}`);

describe("the failure panel on MapLibre", () => {
  it("shows when the style isn't found, over the map's element", async () => {
    const { mounting, container } = mountingMapLibre({ mapStyle: MISSING });
    await expect(mounting).rejects.toMatchObject({ code: "provider-load-failed" });
    const words = queried(container, `.${MAP_FAILURE_CLASS}>*`);
    const { left, top, width, height } = words.getBoundingClientRect();
    expect(document.elementFromPoint(left + width / 2, top + height / 2)).toBe(words);
  });

  it("destroy takes it off, as conformance expects", async () => {
    const { mounting, container, destroy } = mountingMapLibre({ mapStyle: MISSING });
    await expect(mounting).rejects.toMatchObject({ code: "provider-load-failed" });
    expect(panelsIn(container)).toHaveLength(1);
    destroy();
    expect(container.children).toHaveLength(0);
  });

  it("shows none for a failure on maplace's own source: the map still works", async () => {
    const { map, container, host } = await mountedMapLibre();
    map.fire("error", { error: new Error("no data"), sourceId: OWN_SOURCES[0] });
    expect(host.reportsOf("reportError")).toHaveLength(1);
    expect(panelsIn(container)).toHaveLength(0);
  });

  it("shows none on a page's own map, whose style is missing", async () => {
    const { map, container, host } = await mountedOnPageMap();
    vi.spyOn(console, "error").mockImplementation(() => {});
    map.setStyle(MISSING, { diff: false });
    await vi.waitFor(() => expect(host.reportsOf("reportError")).toHaveLength(1), {
      timeout: 10_000,
    });
    expect(panelsIn(container)).toHaveLength(0);
  });

  it("shows when createMapLibreMap's style isn't found", async () => {
    const container = sizedContainer();
    const maplace = createMapLibreMap(container, { mapStyle: MISSING });
    await expect(maplace.whenReady()).rejects.toMatchObject({ code: "provider-load-failed" });
    expect(panelsIn(container)).toHaveLength(1);
    maplace.destroy();
    expect(panelsIn(container)).toHaveLength(0);
    container.remove();
  });
});

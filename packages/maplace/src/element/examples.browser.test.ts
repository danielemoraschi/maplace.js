import { afterEach, describe, expect, it, vi } from "vitest";
import { byId } from "../../examples/page";
import { EXAMPLE_PAGES } from "../testing/examples/example-files";
import { cdnScriptOf, type OpenedPage, openPage } from "../testing/examples/example-page";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { shownIds, sortedIds } from "../testing/examples/recorded-stores";
import type { FakeAdapter } from "../testing/fake-adapter";
import { adaptersMade } from "./testing/fake-maps";

// The example pages, as readers copy them, on the fake provider: the only one registered.

/** The two CDN scripts (RFC §3): a page with `cluster` needs the second. */
const PLAIN_SCRIPT = "maplace-element.iife.js";
const CLUSTER_SCRIPT = "maplace-element-cluster.iife.js";

/** What one page does beyond drawing its locations. */
const BEHAVIOURS: Readonly<
  Record<string, (page: OpenedPage, adapter: FakeAdapter) => Promise<void>>
> = {
  tabs: async ({ map }) => {
    map.maplace.select("milan");
    expect(byId("details").textContent).toBe("milan");
  },
  route: async ({ map }, adapter) => {
    await adapter.probe().settle();
    await expect
      .poll(() => map.maplace.getSnapshot().routeResult?.distanceMeters)
      .toBeGreaterThan(0);
  },
  polygon: async ({ map }, adapter) => {
    const saved: unknown[] = [];
    vi.stubGlobal("save", (location: unknown) => saved.push(location));
    adapter.probe().drag("park", {
      type: "polygon",
      path: [
        { lat: 41.9, lng: 12.48 },
        { lat: 41.93, lng: 12.49 },
        { lat: 41.9, lng: 12.5 },
      ],
    });
    await expect.poll(() => saved).toHaveLength(1);
    expect(map.maplace.getSnapshot().locations[0]).toMatchObject({ id: "park" });
  },
};

afterEach(() => vi.unstubAllGlobals());

describe.each(EXAMPLE_PAGES)("the $name page", ({ name, html }) => {
  it("loads the CDN script its map needs", () => {
    const clusters = /<maplace-map[^>]*\scluster[\s>]/.test(html);
    expect(cdnScriptOf(html)).toBe(clusters ? CLUSTER_SCRIPT : PLAIN_SCRIPT);
  });

  it("opens its map with its locations and list, and does what it says", async () => {
    serveExampleData();
    const made = adaptersMade.length;
    const page = openPage(html);
    await expect.poll(() => adaptersMade.length).toBeGreaterThan(made);
    const adapter = adaptersMade[made] as FakeAdapter;
    await adapter.finishMount();
    await expect.poll(() => page.map.loadState).toBe("ready");
    await expect.poll(() => shownIds(page.map.maplace).length).toBeGreaterThan(0);
    await expect
      .poll(() => sortedIds(adapter.probe().locationIds()))
      .toEqual(shownIds(page.map.maplace));
    if (page.map.hasAttribute("list")) {
      expect(document.querySelector("[role=listbox], select")).not.toBeNull();
    }
    await BEHAVIOURS[name]?.(page, adapter);
    expect(page.errors).toEqual([]);
  });
});

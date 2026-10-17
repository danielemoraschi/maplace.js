import { afterEach, describe, expect, it, vi } from "vitest";
import { EXAMPLE_PAGES } from "../testing/examples/example-files";
import { cdnScriptOf, openPage } from "../testing/examples/example-page";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { shownIds, sortedIds } from "../testing/examples/recorded-stores";
import type { FakeAdapter } from "../testing/fake-adapter";
import { adaptersMade } from "./testing/fake-maps";
import { PAGE_BEHAVIOURS } from "./testing/page-behaviours";

// The example pages, as readers copy them, on the fake provider: the only one registered.

/** The two CDN scripts (RFC §3): a page with `cluster` needs the second. */
const PLAIN_SCRIPT = "maplace-element.iife.js";
const CLUSTER_SCRIPT = "maplace-element-cluster.iife.js";

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
    await PAGE_BEHAVIOURS[name]?.(page.map, adapter);
    expect(page.errors).toEqual([]);
  });
});

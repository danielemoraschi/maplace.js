import { afterEach, describe, expect, it, vi } from "vitest";
import { EXAMPLE_PAGES } from "../testing/examples/example-files";
import { openPages } from "../testing/examples/example-page";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { shownIds, sortedIds } from "../testing/examples/recorded-stores";
import type { FakeAdapter } from "../testing/fake-adapter";
import type { MaplaceMapElement } from "./index";
import { adaptersMade } from "./testing/fake-maps";
import { PAGE_BEHAVIOURS } from "./testing/page-behaviours";

// Every example page on one page, as the site shows them and as a reader may put two of them
// together: no id is shared, and each map and script works as it does alone.

const ID = /\sid="([^"]+)"/g;

afterEach(() => vi.unstubAllGlobals());

describe("the example pages, all on one page", () => {
  it("name no element with an id another page uses", () => {
    const ids = EXAMPLE_PAGES.flatMap(({ html }) => Array.from(html.matchAll(ID), ([, id]) => id));
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it("open every map with its locations, each page doing what it says", async () => {
    serveExampleData();
    const made = adaptersMade.length;
    const { maps, errors } = openPages(EXAMPLE_PAGES.map(({ html }) => html));
    await expect.poll(() => adaptersMade.length - made).toBe(EXAMPLE_PAGES.length);
    const adapters = adaptersMade.slice(made);
    await Promise.all(adapters.map((adapter) => adapter.finishMount()));
    for (const [index, { name }] of EXAMPLE_PAGES.entries()) {
      const map = maps[index] as MaplaceMapElement;
      const adapter = adapterOf(map, adapters);
      await expect.poll(() => map.loadState).toBe("ready");
      await expect
        .poll(() => sortedIds(adapter.probe().locationIds()))
        .toEqual(shownIds(map.maplace));
      await PAGE_BEHAVIOURS[name]?.(map, adapter);
    }
    expect(errors).toEqual([]);
  });
});

/** The adapter drawing `map`: the one whose container is inside it. */
function adapterOf(map: MaplaceMapElement, adapters: readonly FakeAdapter[]): FakeAdapter {
  const adapter = adapters.find(({ mounted }) => mounted && map.contains(mounted.container));
  if (adapter === undefined) throw new Error(`no adapter draws the map #${map.id}`);
  return adapter;
}

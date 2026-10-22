import { afterEach, describe, expect, it, vi } from "vitest";
import { behaviourOf } from "../testing/examples/example-behaviours";
import { parse } from "../testing/examples/example-dom";
import {
  EXAMPLE_PAGES,
  type ExamplePage,
  isDrawnOn,
  onProvider,
} from "../testing/examples/example-files";
import { cdnScriptOf, openPage } from "../testing/examples/example-page";
import {
  adapterInside,
  exampleRun,
  expectDrawsItsStore,
  hasList,
} from "../testing/examples/example-runs";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { adaptersMade } from "./testing/fake-maps";

// The example pages, as readers copy them, on the fake provider: the only one registered.

/** The CDN scripts (RFC §3): Google's two, the second for `cluster`, and MapLibre's. */
const PLAIN_SCRIPT = "maplace-element.iife.js";
const CLUSTER_SCRIPT = "maplace-element-cluster.iife.js";
const MAPLIBRE_SCRIPT = "maplace-element-maplibre.iife.js";

/** Attributes only Google reads: OpenFreeMap needs no key, and its style sets the colours. */
const GOOGLE_ATTRIBUTES = "[api-key], [map-id], [color-scheme]";

afterEach(() => vi.unstubAllGlobals());

describe.each(EXAMPLE_PAGES)("the $name page ($provider)", (page) => {
  it("loads the CDN script its map needs", () => {
    expect(cdnScriptOf(page.html)).toBe(cdnScriptFor(page));
  });

  it("opens its map with its locations and list, and does what it says", async () => {
    serveExampleData();
    const made = adaptersMade.length;
    const { map, root, errors } = openPage(page.html);
    await expect.poll(() => adaptersMade.length).toBeGreaterThan(made);
    const adapter = adapterInside(root, adaptersMade.slice(made));
    await adapter.finishMount();
    await expect.poll(() => map.loadState).toBe("ready");
    const run = exampleRun({ store: map.maplace, adapter, root }, adaptersMade);
    await expectDrawsItsStore(run);
    expect(hasList(root)).toBe(map.hasAttribute("list"));
    await behaviourOf(page.provider, page.name)?.(run);
    expect(errors).toEqual([]);
  });
});

describe.each(EXAMPLE_PAGES.filter(onProvider("maplibre")))(
  "the $name MapLibre page",
  ({ html }) => {
    // MapLibre ignores a stray `color-scheme` silently (`element/maplibre.ts`): this catches one.
    it("asks for no key, map ID or colour scheme: OpenFreeMap needs no key and its style sets the colours", () => {
      expect(parse(html).querySelectorAll(GOOGLE_ATTRIBUTES)).toHaveLength(0);
    });
  },
);

it("has a MapLibre page only for an example drawn on MapLibre: never route, never one without a Google twin", () => {
  const googleNames = EXAMPLE_PAGES.filter(onProvider("google")).map(({ name }) => name);
  for (const { name } of EXAMPLE_PAGES.filter(onProvider("maplibre"))) {
    expect(googleNames, name).toContain(name);
    expect(isDrawnOn(name, "maplibre"), name).toBe(true);
  }
});

/**
 * The CDN script a page needs (RFC §3): MapLibre's, which clusters too; Google's, or its
 * clustering build for `cluster`.
 */
function cdnScriptFor({ provider, html }: ExamplePage): string {
  if (provider === "maplibre") return MAPLIBRE_SCRIPT;
  const clusters = /<maplace-map[^>]*\scluster[\s>]/.test(html);
  return clusters ? CLUSTER_SCRIPT : PLAIN_SCRIPT;
}

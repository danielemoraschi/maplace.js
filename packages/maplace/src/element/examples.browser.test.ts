import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { behaviourOf } from "../testing/examples/example-behaviours";
import { parse } from "../testing/examples/example-dom";
import { EXAMPLE_PAGES, type ExamplePage, onProvider } from "../testing/examples/example-files";
import { cdnScriptFor, cdnScriptOf, openPage } from "../testing/examples/example-page";
import {
  adapterInside,
  exampleRun,
  expectDrawsItsStore,
  hasList,
} from "../testing/examples/example-runs";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { fakeMaplaceGlobal } from "../testing/examples/fake-maplace-global";
import { fakeAdapters } from "../testing/fake/adapters";
import { adaptersMade } from "./testing/fake-maps";

// The example pages, as readers copy them, on the fake provider: the only one registered.

/** Attributes only Google reads: OpenFreeMap needs no key, and its style sets the colours. */
const GOOGLE_ATTRIBUTES = "[api-key], [map-id], [color-scheme]";

// A page's own script reaches maplace through the CDN script's `Maplace` (custom-list's list).
beforeEach(async () => {
  vi.stubGlobal("Maplace", await fakeMaplaceGlobal(fakeAdapters()));
});
afterEach(() => vi.unstubAllGlobals());

describe.each(EXAMPLE_PAGES)("the $name page ($provider)", (page) => {
  it("loads the CDN script its map needs", () => {
    expect(cdnScriptOf(page.html)).toBe(cdnScriptOfPage(page));
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

it("has a MapLibre page for every example with a Google one, and none without", () => {
  const namesOn = (provider: "google" | "maplibre") =>
    EXAMPLE_PAGES.filter(onProvider(provider)).map(({ name }) => name);
  expect(namesOn("maplibre")).toEqual(namesOn("google"));
});

/** The CDN script a page needs: its `<maplace-map>` asks to cluster with `cluster`. */
const cdnScriptOfPage = ({ provider, html }: ExamplePage) =>
  cdnScriptFor(provider, /<maplace-map[^>]*\scluster[\s>]/.test(html));

import { afterEach, describe, expect, it, vi } from "vitest";
import { EXAMPLE_BEHAVIOURS } from "../testing/examples/example-behaviours";
import { EXAMPLE_PAGES } from "../testing/examples/example-files";
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
    const { map, root, errors } = openPage(html);
    await expect.poll(() => adaptersMade.length).toBeGreaterThan(made);
    const adapter = adapterInside(root, adaptersMade.slice(made));
    await adapter.finishMount();
    await expect.poll(() => map.loadState).toBe("ready");
    const run = exampleRun({ store: map.maplace, adapter, root }, adaptersMade);
    await expectDrawsItsStore(run);
    expect(hasList(root)).toBe(map.hasAttribute("list"));
    await EXAMPLE_BEHAVIOURS[name]?.(run);
    expect(errors).toEqual([]);
  });
});

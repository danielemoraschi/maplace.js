import { afterEach, describe, expect, it, vi } from "vitest";
import type * as Core from "../index";
import { runEveryVersion, type VersionRuns } from "../testing/examples/every-version";
import { EXAMPLE_BEHAVIOURS } from "../testing/examples/example-behaviours";
import { parse } from "../testing/examples/example-dom";
import { EXAMPLE_PAGES, EXAMPLES, type Example } from "../testing/examples/example-files";
import { expectDrawsItsStore, hasList } from "../testing/examples/example-runs";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { recordingCreateMaplace } from "../testing/examples/recorded-stores";
import { comparableSnapshot } from "../testing/examples/version-sameness";
import { adaptersMade } from "./testing/fake-maps";

// Every version of every example on one page, as the site shows them and as a reader may put two
// of them together: no id is shared, each map and script works as it does alone, and an example's
// page, vanilla and React versions are the same map.
const moduleAdapters = await vi.hoisted(async () =>
  (await import("../testing/fake/adapters")).fakeAdapters(),
);
vi.mock("maplace/google", async () => {
  const { fakeGoogleEntry } = await import("../testing/examples/fake-google");
  return fakeGoogleEntry(moduleAdapters);
});
vi.mock("maplace", async (importOriginal) => {
  const real = await importOriginal<typeof Core>();
  return { ...real, createMaplace: recordingCreateMaplace(real.createMaplace) };
});

const ID = /\sid="([^"]+)"/g;

afterEach(() => vi.unstubAllGlobals());

describe("every example version, all on one page", () => {
  it("mounts each vanilla map and React root on the id the site lays out", () => {
    for (const { name, vanilla, react } of EXAMPLES) {
      expect(parse(vanilla.html).getElementById(`${name}-vanilla-map`), name).not.toBeNull();
      expect(parse(react.html).getElementById(`${name}-react-root`), name).not.toBeNull();
    }
  });

  it("names no element with an id another version uses", () => {
    const htmls = [
      ...EXAMPLE_PAGES.map(({ html }) => html),
      ...EXAMPLES.flatMap(({ vanilla, react }) => [vanilla.html, react.html]),
    ];
    const ids = htmls.flatMap((html) => Array.from(html.matchAll(ID), ([, id]) => id));
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it("draws each example the same in all three, each doing what it says", async () => {
    serveExampleData();
    const { runs, errors } = await runEveryVersion({
      pageAdapters: adaptersMade,
      moduleAdapters: moduleAdapters.made,
    });
    for (const [example, versions] of runs) await expectSameMap(example, versions);
    expect(errors).toEqual([]);
  });
});

/** The three versions show the same locations, route, filter, selection and list, and behave. */
async function expectSameMap({ name }: Example, runs: VersionRuns): Promise<void> {
  const { page, vanilla, react } = runs;
  for (const version of [vanilla, react]) {
    await expect
      .poll(() => comparableSnapshot(version.store), { message: name })
      .toEqual(comparableSnapshot(page.store));
    await expect.poll(() => hasList(version.root), { message: name }).toBe(hasList(page.root));
  }
  for (const run of [page, vanilla, react]) {
    await expectDrawsItsStore(run);
    await EXAMPLE_BEHAVIOURS[name]?.(run);
  }
}

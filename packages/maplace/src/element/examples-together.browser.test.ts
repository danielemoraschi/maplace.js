import { afterEach, describe, expect, it, vi } from "vitest";
import type * as Core from "../index";
import {
  runEveryVersion,
  type VersionRuns,
  versionRunsOf,
} from "../testing/examples/every-version";
import { behaviourOf } from "../testing/examples/example-behaviours";
import { parse } from "../testing/examples/example-dom";
import {
  EXAMPLE_PAGES,
  EXAMPLES,
  type Example,
  googleTwinOf,
  onProvider,
} from "../testing/examples/example-files";
import { type ExampleRun, expectDrawsItsStore, hasList } from "../testing/examples/example-runs";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { recordingCreateMaplace } from "../testing/examples/recorded-stores";
import { comparableSnapshot } from "../testing/examples/version-sameness";
import { adaptersMade } from "./testing/fake-maps";

// Every version of every example on one page, as the site shows them and as a reader may put two
// of them together: no id is shared, each map and script works as it does alone, and an example's
// page, vanilla and React versions are the same map, on Google and on MapLibre.
const moduleAdapters = await vi.hoisted(async () =>
  (await import("../testing/fake/adapters")).fakeAdapters(),
);
vi.mock("maplace/google", async () => {
  const { fakeGoogleEntry } = await import("../testing/examples/fake-google");
  return fakeGoogleEntry(moduleAdapters);
});
vi.mock("maplace/maplibre", async () => {
  const { fakeMapLibreEntry } = await import("../testing/examples/fake-maplibre");
  return fakeMapLibreEntry(moduleAdapters);
});
vi.mock("maplace", async (importOriginal) => {
  const real = await importOriginal<typeof Core>();
  return { ...real, createMaplace: recordingCreateMaplace(real.createMaplace) };
});

const ID = /\sid="([^"]+)"/g;

afterEach(() => vi.unstubAllGlobals());

describe("every example version, all on one page", () => {
  it("mounts each vanilla map and React root on the id the site lays out", () => {
    for (const example of EXAMPLES) {
      const { vanilla, react } = example;
      const prefix = idPrefixOf(example);
      expect(parse(vanilla.html).getElementById(`${prefix}-vanilla-map`), prefix).not.toBeNull();
      expect(parse(react.html).getElementById(`${prefix}-react-root`), prefix).not.toBeNull();
    }
  });

  it("names each MapLibre page's map as its Google twin names its own, with -maplibre", () => {
    for (const example of EXAMPLES.filter(onProvider("maplibre"))) {
      const twinId = mapIdOf(googleTwinOf(example).page.html);
      const expected = twinId.replace(example.name, idPrefixOf(example));
      expect(mapIdOf(example.page.html), example.name).toBe(expected);
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

  it("draws each example the same in all its versions and on both providers, each doing what it says", async () => {
    serveExampleData();
    const { runs, errors } = await runEveryVersion({
      pageAdapters: adaptersMade,
      moduleAdapters: moduleAdapters.made,
    });
    for (const example of EXAMPLES.filter(onProvider("maplibre"))) {
      await expectSameAsGoogle(example, runs);
    }
    for (const [example, versions] of runs) await expectSameMap(example, versions);
    expect(errors).toEqual([]);
  });
});

/** The ids the site lays out: `simple-vanilla-map`, `simple-maplibre-vanilla-map`. */
function idPrefixOf({ name, provider }: Example): string {
  return provider === "google" ? name : `${name}-${provider}`;
}

function mapIdOf(html: string): string {
  return parse(html).querySelector("maplace-map")?.id ?? "";
}

/**
 * An example's MapLibre page shows what its Google page shows, list and all: checked before any
 * behaviour moves either store. Each provider's versions are then checked against their own page.
 */
async function expectSameAsGoogle(
  example: Example,
  runs: ReadonlyMap<Example, VersionRuns>,
): Promise<void> {
  const maplibre = versionRunsOf(runs, example).page;
  const google = versionRunsOf(runs, googleTwinOf(example)).page;
  await expectShowsAs(maplibre, google, example.name);
}

/** The three versions show the same map, and behave. */
async function expectSameMap({ name, provider }: Example, runs: VersionRuns): Promise<void> {
  const { page, vanilla, react } = runs;
  for (const version of [vanilla, react]) await expectShowsAs(version, page, name);
  for (const run of [page, vanilla, react]) {
    await expectDrawsItsStore(run);
    await behaviourOf(provider, name)?.(run);
  }
}

/** `actual` shows what `expected` shows: the same locations, route, filter, selection and list. */
async function expectShowsAs(
  actual: ExampleRun,
  expected: ExampleRun,
  name: string,
): Promise<void> {
  await expect
    .poll(() => comparableSnapshot(actual.store), { message: name })
    .toEqual(comparableSnapshot(expected.store));
  await expect.poll(() => hasList(actual.root), { message: name }).toBe(hasList(expected.root));
}

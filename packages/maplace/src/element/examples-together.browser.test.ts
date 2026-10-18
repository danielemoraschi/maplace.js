import { afterEach, describe, expect, it, vi } from "vitest";
import type * as Core from "../index";
import { EXAMPLE_BEHAVIOURS } from "../testing/examples/example-behaviours";
import { EXAMPLE_PAGES, EXAMPLES, type Example } from "../testing/examples/example-files";
import { openHost } from "../testing/examples/example-hosts";
import { openPages, parse } from "../testing/examples/example-page";
import {
  adapterInside,
  comparableSnapshot,
  type ExampleRun,
  exampleRun,
  expectDrawsItsStore,
  hasList,
  runHost,
} from "../testing/examples/example-runs";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { recordingCreateMaplace } from "../testing/examples/recorded-stores";
import { createFakeAdapter, type FakeAdapter } from "../testing/fake-adapter";
import type { MaplaceMapElement } from "./index";
import { adaptersMade } from "./testing/fake-maps";

// Every version of every example on one page, as the site shows them and as a reader may put two
// of them together: no id is shared, each map and script works as it does alone, and an example's
// page, vanilla and React versions are the same map.
const moduleAdapters: FakeAdapter[] = [];
vi.mock("maplace/google", () => ({
  createGoogleAdapter: () => {
    const adapter = createFakeAdapter();
    moduleAdapters.push(adapter);
    return adapter;
  },
}));
vi.mock("maplace", async (importOriginal) => {
  const real = await importOriginal<typeof Core>();
  return { ...real, createMaplace: recordingCreateMaplace(real.createMaplace) };
});

const ID = /\sid="([^"]+)"/g;

/** One example's three versions, running. */
type ExampleRuns = readonly [page: ExampleRun, vanilla: ExampleRun, react: ExampleRun];

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
    const pages = await openEveryPage();
    const opened = EXAMPLES.map(
      (example) => [example, openHost(example.vanilla.html), openHost(example.react.html)] as const,
    );
    // One after another: the stores made since a module ran are that module's.
    const runs: (readonly [Example, ExampleRuns])[] = [];
    for (const [example, vanillaRoot, reactRoot] of opened) {
      const vanilla = await runHost(example.vanilla, vanillaRoot, moduleAdapters);
      const react = await runHost(example.react, reactRoot, moduleAdapters);
      runs.push([example, [pages.runOf(example), vanilla, react]]);
    }
    for (const [example, versions] of runs) await expectSameMap(example, versions);
    expect(pages.errors).toEqual([]);
  });
});

/** Every page opened and its map ready; each example's page run, by name. */
async function openEveryPage() {
  const made = adaptersMade.length;
  const { maps, roots, errors } = openPages(EXAMPLE_PAGES.map(({ html }) => html));
  await expect.poll(() => adaptersMade.length - made).toBe(EXAMPLE_PAGES.length);
  const adapters = adaptersMade.slice(made);
  await Promise.all(adapters.map((adapter) => adapter.finishMount()));
  await Promise.all(maps.map((map) => expect.poll(() => map.loadState).toBe("ready")));
  const runOf = ({ page }: Example): ExampleRun => {
    const index = EXAMPLE_PAGES.indexOf(page);
    const map = maps[index] as MaplaceMapElement;
    const root = roots[index] as HTMLElement;
    const adapter = adapterInside(root, adapters);
    return exampleRun({ store: map.maplace, adapter, root }, adaptersMade);
  };
  return { runOf, errors };
}

/** The three versions show the same locations, route, filter, selection and list, and behave. */
async function expectSameMap({ name }: Example, runs: ExampleRuns): Promise<void> {
  const [page, ...versions] = runs;
  for (const version of versions) {
    await expect
      .poll(() => comparableSnapshot(version.store), { message: name })
      .toEqual(comparableSnapshot(page.store));
    await expect.poll(() => hasList(version.root), { message: name }).toBe(hasList(page.root));
  }
  for (const run of runs) {
    await expectDrawsItsStore(run);
    await EXAMPLE_BEHAVIOURS[name]?.(run);
  }
}

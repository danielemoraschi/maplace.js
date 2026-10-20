import { expect, vi } from "vitest";
import type { MaplaceMapElement } from "../../element/index";
import type { FakeAdapter } from "../fake-adapter";
import { EXAMPLE_PAGES, EXAMPLES, type Example } from "./example-files";
import { openHost } from "./example-hosts";
import { openPages } from "./example-page";
import { adapterInside, type ExampleRun, exampleRun, runHost } from "./example-runs";

/** Every example's page open on one document, its map ready and settled. */
interface EveryPage {
  /** The run of an example's page. */
  runOf(example: Example): ExampleRun;
  /** What the pages' scripts threw. */
  readonly errors: readonly unknown[];
}

/**
 * Opens every example's page and waits for each map to be ready, with what it draws once settled
 * (route's directions, a source's locations). `made` is the element's list of the adapters it
 * made. Waits with `vi.waitFor`, so it runs in a hook as in a test.
 */
async function openEveryPage(made: readonly FakeAdapter[]): Promise<EveryPage> {
  const before = made.length;
  const { maps, roots, errors } = openPages(EXAMPLE_PAGES.map(({ html }) => html));
  await vi.waitFor(() => expect(made.length - before).toBe(EXAMPLE_PAGES.length));
  const adapters = made.slice(before);
  await Promise.all(adapters.map((adapter) => adapter.finishMount()));
  await Promise.all(maps.map((map) => vi.waitFor(() => expect(map.loadState).toBe("ready"))));
  await Promise.all(adapters.map((adapter) => adapter.probe().settle()));
  const runOf = ({ page }: Example): ExampleRun => {
    const index = EXAMPLE_PAGES.indexOf(page);
    const map = maps[index] as MaplaceMapElement;
    const root = roots[index] as HTMLElement;
    return exampleRun({ store: map.maplace, adapter: adapterInside(root, adapters), root }, made);
  };
  return { runOf, errors };
}

/** An example's three versions, running. */
export interface VersionRuns {
  readonly page: ExampleRun;
  readonly vanilla: ExampleRun;
  readonly react: ExampleRun;
}

/** Where the adapters come from: the element's, and the one `maplace/google`'s mock makes. */
export interface VersionAdapters {
  readonly pageAdapters: readonly FakeAdapter[];
  readonly moduleAdapters: readonly FakeAdapter[];
}

/** Every example's versions on one document, running, and what the pages' scripts threw. */
export interface EveryVersion {
  readonly runs: ReadonlyMap<Example, VersionRuns>;
  readonly errors: readonly unknown[];
}

/**
 * Opens every example's page and hosts, then runs the hosts' modules one after another, since
 * the stores made since a module ran are that module's. `beforeOpening` lays the versions out
 * before any of them opens, so a page's map mounts in the same room as a module's.
 */
export async function runEveryVersion(
  { pageAdapters, moduleAdapters }: VersionAdapters,
  beforeOpening: () => void = () => undefined,
): Promise<EveryVersion> {
  beforeOpening();
  const pages = await openEveryPage(pageAdapters);
  const opened = EXAMPLES.map(
    (example) => [example, openHost(example.vanilla.html), openHost(example.react.html)] as const,
  );
  const runs = new Map<Example, VersionRuns>();
  for (const [example, vanillaRoot, reactRoot] of opened) {
    const vanilla = await runHost(example.vanilla, vanillaRoot, moduleAdapters);
    const react = await runHost(example.react, reactRoot, moduleAdapters);
    runs.set(example, { page: pages.runOf(example), vanilla, react });
  }
  return { runs, errors: pages.errors };
}

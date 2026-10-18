import { expect, vi } from "vitest";
import type { Maplace } from "../../index";
import type { Location } from "../../location";
import type { FakeAdapter } from "../fake-adapter";
import { EXAMPLE_BEHAVIOURS } from "./example-behaviours";
import { EXAMPLE_PAGES, type ExampleHost } from "./example-files";
import { openHost } from "./example-hosts";
import { parse, recordErrors } from "./example-page";
import { recordedStoreCount, shownIds, sortedIds, storeAttachedSince } from "./recorded-stores";

/**
 * One version of an example running on the fake: its store, the adapter drawing its map, and the
 * element holding everything the version put on the page.
 */
export interface ExampleRun {
  readonly store: Maplace;
  readonly adapter: FakeAdapter;
  readonly root: Element;
  /** The adapter drawing the run's map now: another than `adapter` once the map opened again. */
  liveAdapter(): FakeAdapter;
}

/** The run of `store` on `adapter`, inside `root`, among the adapters `made` so far. */
export function exampleRun(
  run: Omit<ExampleRun, "liveAdapter">,
  made: readonly FakeAdapter[],
): ExampleRun {
  return { ...run, liveAdapter: () => adapterInside(run.root, made) };
}

/** The one live adapter whose map is inside `root`: a version's map, among every map made. */
export function adapterInside(root: Element, adapters: readonly FakeAdapter[]): FakeAdapter {
  const inside = adapters.filter(
    ({ destroyed, mounted }) =>
      !destroyed && mounted !== undefined && root.contains(mounted.container),
  );
  if (inside.length !== 1) {
    throw new Error(`${inside.length} live maps inside ${describe(root)}, expected 1`);
  }
  return inside[0] as FakeAdapter;
}

/**
 * `host`'s module run on its opened nodes in `root`, its map mounted: the store made since is its
 * own, and its adapter the one of `adapters` inside `root` (React attaches in an effect, so both
 * are waited for).
 */
export async function runHost(
  host: ExampleHost,
  root: Element,
  adapters: readonly FakeAdapter[],
): Promise<ExampleRun> {
  const stores = recordedStoreCount();
  await host.run();
  const store = await vi.waitFor(() => storeAttachedSince(stores));
  const adapter = await vi.waitFor(() => adapterInside(root, adapters));
  await adapter.finishMount();
  await adapter.probe().settle();
  return exampleRun({ store, adapter, root }, adapters);
}

/**
 * `host` opened and run alone on the fake: it draws its store on the map it mounts on, shows a
 * list where its page does, does what its example says, and reports nothing going wrong.
 */
export async function expectVersionRuns(
  host: ExampleHost,
  adapters: readonly FakeAdapter[],
): Promise<void> {
  const root = openHost(host.html);
  const errors = recordErrors();
  const run = await runHost(host, root, adapters);
  await expectDrawsItsStore(run);
  await expect.poll(() => hasList(root)).toBe(pageShowsList(host.example));
  await EXAMPLE_BEHAVIOURS[host.example]?.(run);
  expect(errors).toEqual([]);
}

/** The run's map draws what its store shows, at least one location (large diffs come in chunks). */
export async function expectDrawsItsStore({ store, adapter }: ExampleRun): Promise<void> {
  await expect.poll(() => shownIds(store).length).toBeGreaterThan(0);
  await expect.poll(() => sortedIds(adapter.probe().locationIds())).toEqual(shownIds(store));
}

/**
 * What makes two versions of an example the same map: every location field but how its popup
 * and marker are given (`content`, `icon`, and React's own fields in `data`, which the
 * behaviours check by what they draw), its route, filter and selection.
 */
export function comparableSnapshot(store: Maplace): unknown {
  const { locations, route, filter, selectedId } = store.getSnapshot();
  return { locations: locations.map(withoutPresentation), route, filter, selectedId };
}

const PRESENTATION: ReadonlySet<string> = new Set(["content", "icon", "data"]);

function withoutPresentation(location: Location): Partial<Location> {
  return Object.fromEntries(Object.entries(location).filter(([key]) => !PRESENTATION.has(key)));
}

/** Whether a list, as listbox, select or a page's own fieldset of radios, is inside `root`. */
export function hasList(root: Element): boolean {
  return root.querySelector("[role=listbox], select, fieldset:has(input[type=radio])") !== null;
}

/** Whether `example`'s page shows a list: its `<maplace-map>` has `list`, whatever its value. */
function pageShowsList(example: string): boolean {
  const page = EXAMPLE_PAGES.find(({ name }) => name === example);
  if (page === undefined) throw new Error(`${example} has no page`);
  return parse(page.html).querySelector("maplace-map[list]") !== null;
}

/** A root named by the first id inside it, for a failure's message. */
function describe(root: Element): string {
  const named = root.querySelector("[id]");
  return named ? `the root holding #${named.id}` : "a root with no id inside";
}

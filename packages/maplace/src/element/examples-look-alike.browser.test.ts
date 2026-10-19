import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type * as Core from "../index";
import { EXAMPLE_PAGES, EXAMPLES, type Example } from "../testing/examples/example-files";
import { openHost } from "../testing/examples/example-hosts";
import { expectLooksAlike, layoutOf, MAP_HEIGHT_STYLE } from "../testing/examples/example-layout";
import { openPages } from "../testing/examples/example-page";
import { adapterInside, type ExampleRun, runHost } from "../testing/examples/example-runs";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { recordingCreateMaplace } from "../testing/examples/recorded-stores";
import type { FakeAdapter } from "../testing/fake-adapter";
import { adaptersMade } from "./testing/fake-maps";

// An example's three versions look the same to a reader: switching between them on the site
// leaves the map, its list and the page's controls where they were, looking as they did. The fake
// draws a corner's controls in the map's flow, so corners are compared on real Maps instead.
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

/** The width the site gives a version at its widest. */
const VERSION_WIDTH = "960px";

/** What each version shows, as the part holding it and the map drawn in it. */
interface Shown {
  readonly root: Element;
  readonly map: () => Element;
}

const HOST_KINDS = ["vanilla", "react"] as const;

const shown = new Map<Example, Readonly<Record<"page" | (typeof HOST_KINDS)[number], Shown>>>();

beforeAll(async () => {
  serveExampleData();
  const pages = await openEveryPage();
  const hosts = EXAMPLES.map(
    (example) => [example, openHost(example.vanilla.html), openHost(example.react.html)] as const,
  );
  giveVersionsTheirRoom();
  // One after another: the stores made since a module ran are that module's.
  for (const [example, vanillaRoot, reactRoot] of hosts) {
    const vanilla = await runHost(example.vanilla, vanillaRoot, moduleAdapters.made);
    const react = await runHost(example.react, reactRoot, moduleAdapters.made);
    shown.set(example, { page: pages(example), vanilla: shownBy(vanilla), react: shownBy(react) });
  }
});

afterAll(() => vi.unstubAllGlobals());

describe.each(EXAMPLES)("the $name example", (example) => {
  it.each(HOST_KINDS)("looks in its %s version as on its page", async (kind) => {
    const versions = shown.get(example);
    if (versions === undefined) throw new Error(`${example.name} wasn't opened`);
    const [page, version] = [versions.page, versions[kind]];
    await vi.waitFor(() =>
      expectLooksAlike(layoutOf(version.root, version.map()), layoutOf(page.root, page.map())),
    );
  });
});

/** Every page opened, its map ready; each example's page shown, by example. */
async function openEveryPage(): Promise<(example: Example) => Shown> {
  const made = adaptersMade.length;
  const { maps, roots } = openPages(EXAMPLE_PAGES.map(({ html }) => html));
  await vi.waitFor(() => expect(adaptersMade.length - made).toBe(EXAMPLE_PAGES.length));
  const adapters = adaptersMade.slice(made);
  await Promise.all(adapters.map((adapter) => adapter.finishMount()));
  await Promise.all(maps.map((map) => vi.waitFor(() => expect(map.loadState).toBe("ready"))));
  await Promise.all(adapters.map((adapter) => adapter.probe().settle()));
  return ({ page }) => {
    const root = roots[EXAMPLE_PAGES.indexOf(page)] as HTMLElement;
    return { root, map: () => drawnIn(adapterInside(root, adapters)) };
  };
}

function shownBy({ root, liveAdapter }: ExampleRun): Shown {
  return { root, map: () => drawnIn(liveAdapter()) };
}

/** The element a map is drawn in: the adapter's container. */
function drawnIn(adapter: FakeAdapter): Element {
  if (adapter.mounted === undefined) throw new Error("the version's map isn't mounted");
  return adapter.mounted.container;
}

/** Each version as wide as the site shows it, and a page's map as tall as the hosts' own. */
function giveVersionsTheirRoom(): void {
  const style = document.createElement("style");
  style.textContent = `body > div { width: ${VERSION_WIDTH}; } ${MAP_HEIGHT_STYLE}`;
  document.head.append(style);
}

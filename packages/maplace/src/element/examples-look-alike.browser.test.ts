import { afterAll, beforeAll, describe, it, vi } from "vitest";
import type * as Core from "../index";
import { runEveryVersion, type VersionRuns } from "../testing/examples/every-version";
import { EXAMPLES, type Example, HOST_KINDS } from "../testing/examples/example-files";
import { expectLooksAlike, type LookPart, layoutOf } from "../testing/examples/example-layout";
import type { ExampleRun } from "../testing/examples/example-runs";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { recordingCreateMaplace } from "../testing/examples/recorded-stores";
import type { FakeAdapter } from "../testing/fake-adapter";
import { adaptersMade } from "./testing/fake-maps";
import { restoreScreen, showOnPhone } from "./testing/screens";

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

let runs: ReadonlyMap<Example, VersionRuns> = new Map();

beforeAll(async () => {
  serveExampleData();
  ({ runs } = await runEveryVersion(
    { pageAdapters: adaptersMade, moduleAdapters: moduleAdapters.made },
    giveVersionsTheirRoom,
  ));
});

afterAll(() => vi.unstubAllGlobals());

describe.each(EXAMPLES)("the $name example", (example) => {
  it.each(HOST_KINDS)("looks in its %s version as on its page", (kind) =>
    expectVersionLooksAsPage(example, kind),
  );
});

describe("on a phone", () => {
  beforeAll(showOnPhone);
  afterAll(restoreScreen);

  describe.each(EXAMPLES)("the $name example", (example) => {
    it.each(HOST_KINDS)("looks in its %s version as on its page", (kind) =>
      expectVersionLooksAsPage(example, kind),
    );
  });
});

async function expectVersionLooksAsPage(
  example: Example,
  kind: (typeof HOST_KINDS)[number],
): Promise<void> {
  const versions = runs.get(example);
  if (versions === undefined) throw new Error(`${example.name} wasn't opened`);
  await vi.waitFor(() => expectLooksAlike(lookOf(versions[kind]), lookOf(versions.page)));
}

/** What a reader sees of a run's version, its map drawn by the adapter live now. */
function lookOf({ root, liveAdapter }: ExampleRun): LookPart[] {
  return layoutOf(root, drawnIn(liveAdapter()));
}

/** The element a map is drawn in: the adapter's container. */
function drawnIn(adapter: FakeAdapter): Element {
  if (adapter.mounted === undefined) throw new Error("the version's map isn't mounted");
  return adapter.mounted.container;
}

/** Each version as wide as the site shows it, or as the screen when it is narrower. */
function giveVersionsTheirRoom(): void {
  const style = document.createElement("style");
  style.textContent = `body > div { width: min(${VERSION_WIDTH}, 100%); }`;
  document.head.append(style);
}

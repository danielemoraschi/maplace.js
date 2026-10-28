import { afterAll, beforeAll, describe, it, vi } from "vitest";
import type * as Core from "../index";
import {
  runEveryVersion,
  type VersionRuns,
  versionRunsOf,
} from "../testing/examples/every-version";
import {
  EXAMPLES,
  type Example,
  googleTwinOf,
  HOST_KINDS,
  onProvider,
} from "../testing/examples/example-files";
import { expectLooksAlike, type LookPart, layoutOf } from "../testing/examples/example-layout";
import type { ExampleRun } from "../testing/examples/example-runs";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { recordingCreateMaplace } from "../testing/examples/recorded-stores";
import type { FakeAdapter } from "../testing/fake-adapter";
import { adaptersMade } from "./testing/fake-maps";
import { restoreScreen, showOnPhone } from "./testing/screens";

// An example's versions look the same to a reader: switching between them, or between providers,
// on the site leaves the map, its list and the page's controls where they were, looking as they
// did. The fake draws a corner's controls in the map's flow, so corners are compared on real Maps
// instead.
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

/** What only a Google page has, by example, left out when its MapLibre twin is held to it. */
const GOOGLE_ONLY_PARTS: Readonly<Record<string, string>> = {
  // MapLibre has no routing: mixed's page there has no button for the route's data set.
  mixed: 'button[value="c"]',
};

/** The width the site gives a version at its widest. */
const VERSION_WIDTH = "960px";

let runs: ReadonlyMap<Example, VersionRuns> = new Map();

beforeAll(async () => {
  serveExampleData();
  ({ runs } = await runEveryVersion(
    { pageAdapters: adaptersMade, moduleAdapters },
    giveVersionsTheirRoom,
  ));
});

afterAll(() => vi.unstubAllGlobals());

describeLookAlike();

describe("on a phone", () => {
  beforeAll(showOnPhone);
  afterAll(restoreScreen);

  describeLookAlike();
});

/** Each version looks as its page, and each MapLibre page as its Google twin's. */
function describeLookAlike(): void {
  describe.each(EXAMPLES)("the $name example ($provider)", (example) => {
    it.each([...HOST_KINDS, "script"] as const)("looks in its %s version as on its page", (kind) =>
      expectRunLooksAs(runsOf(example)[kind], runsOf(example).page),
    );
  });

  describe.each(EXAMPLES.filter(onProvider("maplibre")))(
    "the $name example on MapLibre",
    (example) => {
      it("looks on its page as on Google's page, but for what only Google has", () =>
        withGoogleOnlyPartsTakenOut(example, () =>
          expectRunLooksAs(runsOf(example).page, runsOf(googleTwinOf(example)).page),
        ));
    },
  );
}

/** Runs `compare` with the parts only `example`'s Google twin has taken out of its page. */
async function withGoogleOnlyPartsTakenOut(
  example: Example,
  compare: () => Promise<void>,
): Promise<void> {
  const selector = GOOGLE_ONLY_PARTS[example.name];
  const root = runsOf(googleTwinOf(example)).page.root;
  const parts = selector === undefined ? [] : [...root.querySelectorAll(selector)];
  const putBack = parts.map(takeOut);
  try {
    await compare();
  } finally {
    for (const put of putBack) put();
  }
}

/** Takes `part` out of the page; returns how to put it back where it was. */
function takeOut(part: Element): () => void {
  const placeholder = document.createComment("taken out");
  part.replaceWith(placeholder);
  return () => placeholder.replaceWith(part);
}

function runsOf(example: Example): VersionRuns {
  return versionRunsOf(runs, example);
}

async function expectRunLooksAs(actual: ExampleRun, expected: ExampleRun): Promise<void> {
  await vi.waitFor(() => expectLooksAlike(lookOf(actual), lookOf(expected)));
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

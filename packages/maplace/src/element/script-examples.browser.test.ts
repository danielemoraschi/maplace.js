import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as googleEntry from "../google/index";
import type * as Core from "../index";
import * as core from "../index";
import * as mapLibreEntry from "../maplibre/index";
import { parse } from "../testing/examples/example-dom";
import { onProvider, SCRIPT_VERSIONS } from "../testing/examples/example-files";
import { cdnScriptFor, cdnScriptOf } from "../testing/examples/example-page";
import { expectVersionRuns } from "../testing/examples/example-runs";
import type { ScriptVersion } from "../testing/examples/example-scripts";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { fakeMaplaceGlobal } from "../testing/examples/fake-maplace-global";
import { type FakeAdapters, fakeAdapters } from "../testing/fake/adapters";
import * as elementEntry from "./index";

// The script versions (W33), as readers copy them: a page of its own script on the CDN script's
// `Maplace`, here the fake's. Its stores are recorded, as the module versions' are, by the
// recorder the factory loads itself.
vi.mock("maplace", async (importOriginal) => {
  const real = await importOriginal<typeof Core>();
  const { recordingCreateMaplace } = await import("../testing/examples/recorded-stores");
  return { ...real, createMaplace: recordingCreateMaplace(real.createMaplace) };
});

let adapters: FakeAdapters;

beforeEach(async () => {
  adapters = fakeAdapters();
  vi.stubGlobal("Maplace", await fakeMaplaceGlobal(adapters));
});

afterEach(() => vi.unstubAllGlobals());

describe.each(SCRIPT_VERSIONS)("the $example script version ($provider)", (script) => {
  it("loads the CDN script its map needs, and its program inline, with no module of its own", () => {
    expect(cdnScriptOf(script.html)).toBe(cdnScriptOfVersion(script));
    const programs = [
      ...parse(script.html).querySelectorAll<HTMLScriptElement>("script:not([src])"),
    ];
    expect(programs.map(({ type }) => type)).toEqual(["module"]);
  });

  it("opens its map with its locations and list, and does what it says", async () => {
    serveExampleData();
    await expectVersionRuns(script, adapters.made);
  });
});

/** What each provider's CDN script sets as `Maplace` (W33): its npm entries' exports, and MapLibre's own maplibre-gl. */
const MAPLACE_NAMES = {
  google: new Set(Object.keys({ ...core, ...elementEntry, ...googleEntry })),
  maplibre: new Set([...Object.keys({ ...core, ...elementEntry, ...mapLibreEntry }), "maplibre"]),
};

describe.each(SCRIPT_VERSIONS)(
  "the $example script version's calls ($provider)",
  ({ provider, html }) => {
    // The runners' `Maplace` holds both providers': this holds each version to its own script's.
    it("reaches only what its provider's CDN script sets on Maplace", () => {
      const called = [...html.matchAll(/\bMaplace\.(\w+)/g)].map(([, name]) => name ?? "");
      expect(called.length).toBeGreaterThan(0);
      expect(called.filter((name) => !MAPLACE_NAMES[provider].has(name))).toEqual([]);
    });
  },
);

describe.each(SCRIPT_VERSIONS.filter(onProvider("google")))(
  "the $example script version on Google",
  ({ html }) => {
    it("gives maplace its key to add Maps JS with, and pastes no bootstrap loader", () => {
      expect(html.match(/apiKey: "YOUR_KEY"/g)).toHaveLength(1);
      expect(html).not.toContain("importLibrary");
    });
  },
);

describe.each(SCRIPT_VERSIONS.filter(onProvider("maplibre")))(
  "the $example script version on MapLibre",
  ({ html }) => {
    it("asks for no key and imports no stylesheet: the MapLibre script bundles it", () => {
      expect(html).not.toMatch(/apiKey|api-key|maplibre-gl\.css/);
    });
  },
);

/** The CDN script a script version needs: its program asks to cluster with `cluster: true`. */
const cdnScriptOfVersion = ({ provider, html }: ScriptVersion) =>
  cdnScriptFor(provider, /\bcluster: true\b/.test(html));

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as Core from "../index";
import { onProvider, REACT_HOSTS } from "../testing/examples/example-files";
import {
  bootstrapOf,
  inlineScriptsOf,
  MAPLIBRE_STYLESHEET_IMPORT,
  moduleScriptOf,
} from "../testing/examples/example-hosts";
import { expectVersionRuns } from "../testing/examples/example-runs";
import { serveExampleData } from "../testing/examples/example-surroundings";
import { recordingCreateMaplace } from "../testing/examples/recorded-stores";

// The React examples, each rendering its own root as written, on the HTML beside it, on the fake
// adapter instead of Google's or MapLibre's. Their roots render outside `act`, as on a page, so
// what they show is polled (this file never loads `testing/act-environment`, which tells React it
// is inside `act`, nor `testing/render`, which loads it).
// `maplace` is the source entry the binding imports too, so its stores are recorded.
const adapters = await vi.hoisted(async () =>
  (await import("../testing/fake/adapters")).fakeAdapters(),
);
vi.mock("maplace/google", () => ({ createGoogleAdapter: adapters.createAdapter }));
vi.mock("maplace/maplibre", () => ({ createMapLibreAdapter: adapters.createAdapter }));
vi.mock("maplace", async (importOriginal) => {
  const real = await importOriginal<typeof Core>();
  return { ...real, createMaplace: recordingCreateMaplace(real.createMaplace) };
});

beforeEach(() => serveExampleData());
afterEach(() => vi.unstubAllGlobals());

describe.each(REACT_HOSTS.filter(onProvider("google")))("the $example React version", (host) => {
  it("loads its module, and Maps JS through Google's bootstrap", () => {
    expect(moduleScriptOf(host.html)).toBe("./react.tsx");
    expect(bootstrapOf(host.html)).toContain('key: "YOUR_KEY"');
  });

  it("renders its root: its store on its map, with its page's list, doing what it says", () =>
    expectVersionRuns(host, adapters.made));
});

describe.each(REACT_HOSTS.filter(onProvider("maplibre")))(
  "the $example React version on MapLibre",
  (host) => {
    it("loads its module, which brings maplibre-gl's stylesheet, and no script of its own", () => {
      expect(moduleScriptOf(host.html)).toBe("./react.tsx");
      expect(inlineScriptsOf(host.html)).toEqual([]);
      expect(host.moduleSource).toContain(MAPLIBRE_STYLESHEET_IMPORT);
    });

    it("renders its root: its store on its map, with its page's list, doing what it says", () =>
      expectVersionRuns(host, adapters.made));
  },
);

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as Core from "./index";
import { onProvider, VANILLA_HOSTS } from "./testing/examples/example-files";
import {
  bootstrapOf,
  inlineScriptsOf,
  MAPLIBRE_STYLESHEET_IMPORT,
  moduleScriptOf,
} from "./testing/examples/example-hosts";
import { expectVersionRuns } from "./testing/examples/example-runs";
import { serveExampleData } from "./testing/examples/example-surroundings";
import { recordingCreateMaplace } from "./testing/examples/recorded-stores";

// The vanilla examples, each run as written on the HTML beside it, on the fake adapter instead
// of Google's or MapLibre's.
const adapters = await vi.hoisted(async () =>
  (await import("./testing/fake/adapters")).fakeAdapters(),
);
vi.mock("maplace/google", async () => {
  const { fakeGoogleEntry } = await import("./testing/examples/fake-google");
  return fakeGoogleEntry(adapters);
});
vi.mock("maplace/maplibre", async () => {
  const { fakeMapLibreEntry } = await import("./testing/examples/fake-maplibre");
  return fakeMapLibreEntry(adapters);
});
vi.mock("maplace", async (importOriginal) => {
  const real = await importOriginal<typeof Core>();
  return { ...real, createMaplace: recordingCreateMaplace(real.createMaplace) };
});

beforeEach(() => serveExampleData());
afterEach(() => vi.unstubAllGlobals());

describe.each(VANILLA_HOSTS.filter(onProvider("google")))(
  "the $example vanilla version",
  (host) => {
    it("loads its module, and Maps JS through Google's bootstrap", () => {
      expect(moduleScriptOf(host.html)).toBe("./vanilla.ts");
      expect(bootstrapOf(host.html)).toContain('key: "YOUR_KEY"');
    });

    it("draws its store on the map it mounts on, with its page's list, and does what it says", () =>
      expectVersionRuns(host, adapters.made));
  },
);

describe.each(VANILLA_HOSTS.filter(onProvider("maplibre")))(
  "the $example vanilla version on MapLibre",
  (host) => {
    it("loads its module, which brings maplibre-gl's stylesheet, and no script of its own", () => {
      expect(moduleScriptOf(host.html)).toBe("./vanilla.ts");
      expect(inlineScriptsOf(host.html)).toEqual([]);
      expect(host.moduleSource).toContain(MAPLIBRE_STYLESHEET_IMPORT);
    });

    it("draws its store on the map it mounts on, with its page's list, and does what it says", () =>
      expectVersionRuns(host, adapters.made));
  },
);

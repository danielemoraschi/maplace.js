import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exampleFailureNotes } from "./example-failure-notes.ts";
import { ON_SITE, SITE_MAPLACE } from "./example-map-id.ts";

const ROOT = "/repo/packages/maplace/examples";
const GOOGLE_NOTED = "\0maplace-google-noted";
const MAPLIBRE_NOTED = "\0maplace-maplibre-noted";

function resolved(source: string, importer: string): unknown {
  const { resolveId } = exampleFailureNotes();
  return typeof resolveId === "function"
    ? resolveId.call({} as never, source, importer, { isEntry: false } as never)
    : undefined;
}

function loaded(id: string): string | undefined {
  const { load } = exampleFailureNotes();
  if (typeof load !== "function") return undefined;
  const code = load.call({} as never, id);
  return typeof code === "string" ? code : undefined;
}

describe("exampleFailureNotes", () => {
  it("resolves before Vite does, which would take the entries for the package's", () => {
    expect(exampleFailureNotes().enforce).toBe("pre");
  });

  it("sends the site's map-ID module's maplace/google to the noted Google entry", () => {
    expect(resolved("maplace/google", ON_SITE)).toBe(GOOGLE_NOTED);
  });

  it("sends a version module's and the site's Maplace's maplace/maplibre to the noted MapLibre entry, the dev server's query aside", () => {
    expect(resolved("maplace/maplibre", `${ROOT}/simple/maplibre/vanilla.ts`)).toBe(MAPLIBRE_NOTED);
    expect(resolved("maplace/maplibre", `${ROOT}/simple/maplibre/react.tsx?v=1a2b`)).toBe(
      MAPLIBRE_NOTED,
    );
    expect(resolved("maplace/maplibre", `${SITE_MAPLACE}?v=1a2b`)).toBe(MAPLIBRE_NOTED);
  });

  it("leaves a version module's maplace/google to the map ID, which comes first", () => {
    expect(resolved("maplace/google", `${ROOT}/simple/vanilla.ts`)).toBeUndefined();
    expect(resolved("maplace/google", SITE_MAPLACE)).toBeUndefined();
  });

  it("leaves a noted entry's own import, any other importer and any other import alone", () => {
    expect(resolved("maplace/google", GOOGLE_NOTED)).toBeUndefined();
    expect(resolved("maplace/maplibre", MAPLIBRE_NOTED)).toBeUndefined();
    expect(resolved("maplace/maplibre", "/repo/apps/site/src/scripts/site.ts")).toBeUndefined();
    expect(resolved("maplace", `${ROOT}/simple/maplibre/vanilla.ts`)).toBeUndefined();
    expect(loaded("\0maplace-other")).toBeUndefined();
  });

  it("writes each noted entry: the package's exports, its two calls wrapped, from the wraps' file", () => {
    const calls = [
      [GOOGLE_NOTED, "maplace/google", "createGoogleAdapter", "createGoogleMap"],
      [MAPLIBRE_NOTED, "maplace/maplibre", "createMapLibreAdapter", "createMapLibreMap"],
    ] as const;
    for (const [id, entry, adapter, map] of calls) {
      const code = loaded(id) ?? "";
      expect(code).toContain(`import * as entry from "${entry}";`);
      expect(code).toContain(`export * from "${entry}";`);
      expect(code).toContain(`export const ${adapter} = notingAdapterFailures(entry.${adapter});`);
      expect(code).toContain(`export const ${map} = notingMapFailures(entry.${map});`);
      const wraps = /import \{ notingAdapterFailures, notingMapFailures \} from "([^"]+)";/.exec(
        code,
      );
      expect(wraps?.[1] !== undefined && existsSync(wraps[1]), wraps?.[1]).toBe(true);
    }
  });

  it("writes MapLibre's noted entry to run maplibre-assets.ts's useBuiltWorker before the version's own code", () => {
    const code = loaded(MAPLIBRE_NOTED) ?? "";
    const readied = /import \{ useBuiltWorker \} from "([^"]+)";\nuseBuiltWorker\(\);/.exec(code);
    expect(readied?.[1]?.endsWith("/scripts/maplibre-assets.ts"), code).toBe(true);
    expect(readied?.[1] !== undefined && existsSync(readied[1]), readied?.[1]).toBe(true);
  });

  it("writes Google's noted entry with nothing readied", () => {
    expect(loaded(GOOGLE_NOTED)).not.toContain("useBuiltWorker");
  });
});

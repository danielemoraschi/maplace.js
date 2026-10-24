import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { isOnSiteMapId, ON_SITE, withoutQuery } from "./example-map-id.ts";

/** A provider's entry as the site gives it: its id, and its two calls that make a map. */
interface NotedEntry {
  readonly id: string;
  readonly adapter: string;
  readonly map: string;
}

/** The provider entries the site notes failed loads of, as the examples import them. */
type NotedName = "maplace/google" | "maplace/maplibre";

/** Each provider entry the site notes failed loads of. */
const NOTED_ENTRIES: Readonly<Record<NotedName, NotedEntry>> = {
  "maplace/google": {
    id: "\0maplace-google-noted",
    adapter: "createGoogleAdapter",
    map: "createGoogleMap",
  },
  "maplace/maplibre": {
    id: "\0maplace-maplibre-noted",
    adapter: "createMapLibreAdapter",
    map: "createMapLibreMap",
  },
};

const VERSION_MAP_FAILURES = fileURLToPath(
  new URL("../scripts/version-map-failures.ts", import.meta.url),
);

/** The noted module of `entry`: the package's exports, its two calls wrapped. */
function notedModule(entry: NotedName): string {
  const { adapter, map } = NOTED_ENTRIES[entry];
  return [
    `import * as entry from ${JSON.stringify(entry)};`,
    `import { notingAdapterFailures, notingMapFailures } from ${JSON.stringify(VERSION_MAP_FAILURES)};`,
    `export * from ${JSON.stringify(entry)};`,
    `export const ${adapter} = notingAdapterFailures(entry.${adapter});`,
    `export const ${map} = notingMapFailures(entry.${map});`,
  ].join("\n");
}

/**
 * The noted entry for `source` from `importer`: Google's for the site's map-ID module, whose
 * `maplace/google` the version modules and the site's `Maplace` reach through it
 * (`exampleMapId`); MapLibre's for those importers themselves. A noted module's own import of
 * its entry is none of these, so it reaches the package.
 */
function notedFor(source: string, importer: string): string | undefined {
  if (source === "maplace/google" && importer === ON_SITE) return NOTED_ENTRIES[source].id;
  if (source === "maplace/maplibre" && isOnSiteMapId(importer)) return NOTED_ENTRIES[source].id;
  return undefined;
}

/**
 * Says in a version's note when its map didn't load, as a page map's says: the examples' vanilla
 * and React versions, and the site's `Maplace` its script versions call, get a `maplace/google`
 * and a `maplace/maplibre` whose calls note a failed load (`version-map-failures.ts`), the
 * example files unchanged.
 */
export function exampleFailureNotes(): Plugin {
  const entryOf = new Map(
    (Object.keys(NOTED_ENTRIES) as NotedName[]).map((entry) => [NOTED_ENTRIES[entry].id, entry]),
  );
  return {
    name: "maplace-example-failure-notes",
    // Before Vite's own resolver, which would take the entries for the package's.
    enforce: "pre",
    resolveId(source, importer) {
      if (importer === undefined || !Object.hasOwn(NOTED_ENTRIES, source)) return undefined;
      return notedFor(source, withoutQuery(importer));
    },
    load(id) {
      const entry = entryOf.get(id);
      return entry === undefined ? undefined : notedModule(entry);
    },
  };
}

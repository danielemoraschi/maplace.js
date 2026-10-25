import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { isOnSiteMapId, ON_SITE, withoutQuery } from "./example-map-id.ts";

/**
 * A provider's entry as the site gives it: its id, its two calls that make a map, and the module
 * that readies the provider, if any, run before the version's own code.
 */
interface NotedEntry {
  readonly id: string;
  readonly adapter: string;
  readonly map: string;
  /** A module whose `useBuiltWorker()` readies the provider's library: `maplibre-assets.ts`. */
  readonly builtWorkerFrom?: string;
}

/**
 * maplibre-gl's stylesheet and worker for the site's build. Imported whole, not just
 * `setWorkerUrl`: it is what brings a script version its stylesheet.
 */
const MAPLIBRE_ASSETS = fileURLToPath(new URL("../scripts/maplibre-assets.ts", import.meta.url));

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
    builtWorkerFrom: MAPLIBRE_ASSETS,
  },
};

const VERSION_MAP_FAILURES = fileURLToPath(
  new URL("../scripts/version-map-failures.ts", import.meta.url),
);

/**
 * The noted module of `entry`: the package's exports, its two calls wrapped, and the provider
 * readied first when the entry names what readies it (`builtWorkerFrom`).
 */
function notedModule(entry: NotedName): string {
  const { adapter, map, builtWorkerFrom } = NOTED_ENTRIES[entry];
  return [
    `import * as entry from ${JSON.stringify(entry)};`,
    `import { notingAdapterFailures, notingMapFailures } from ${JSON.stringify(VERSION_MAP_FAILURES)};`,
    ...(builtWorkerFrom ? workerReadyingLines(builtWorkerFrom) : []),
    `export * from ${JSON.stringify(entry)};`,
    `export const ${adapter} = notingAdapterFailures(entry.${adapter});`,
    `export const ${map} = notingMapFailures(entry.${map});`,
  ].join("\n");
}

/**
 * The lines that ready the provider from `module`, before the version's own code runs: its
 * dependencies are fetched together with the version's module, and run first.
 */
function workerReadyingLines(module: string): string[] {
  return [`import { useBuiltWorker } from ${JSON.stringify(module)};`, "useBuiltWorker();"];
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
 * example files unchanged. MapLibre's also readies maplibre-gl (its stylesheet, its worker)
 * before the version's code runs, fetched beside the version's module rather than after it.
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

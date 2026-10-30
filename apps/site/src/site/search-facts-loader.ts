import type { Loader } from "astro/loaders";
import { packageManifest } from "../../../../scripts/build/package.ts";
import type { Manifest } from "../../../../scripts/build/packed-manifest.ts";
import { lastChangeOf } from "./git-dates.ts";
import { pageSources } from "./page-sources.ts";
import { SITE_ROUTES } from "./site-routes.ts";

/** The `searchFacts` collection's one entry. */
export const SEARCH_FACTS_ENTRY = "site";

/** The library, as its manifest names it. */
export interface LibraryFacts {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly license: string;
}

/** What a page's metadata and the sitemap need from the repo. */
export interface SearchFacts {
  /** Each route's last change, `YYYY-MM-DD`. */
  readonly modifiedOn: Readonly<Record<string, string>>;
  readonly library: LibraryFacts;
}

/** The manifest's `field`, which must be text: a blank licence is never published. */
export function requiredText(manifest: Manifest, field: string): string {
  const value = manifest[field];
  if (typeof value !== "string" || value === "") {
    throw new Error(`the package's manifest has no ${field}`);
  }
  return value;
}

export function searchFacts(): SearchFacts {
  const manifest = packageManifest();
  return {
    modifiedOn: Object.fromEntries(
      SITE_ROUTES.map((route) => [route, lastChangeOf(pageSources(route))]),
    ),
    library: {
      name: requiredText(manifest, "name"),
      description: requiredText(manifest, "description"),
      version: manifest.version,
      license: requiredText(manifest, "license"),
    },
  };
}

/** The content loader of the `searchFacts` collection, for the pages (a bundled page can't ask git). */
export function searchFactsLoader(): Loader {
  return {
    name: "search-facts",
    async load({ store }) {
      store.clear();
      store.set({ id: SEARCH_FACTS_ENTRY, data: { ...searchFacts() } });
    },
  };
}

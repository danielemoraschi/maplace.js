import type { LoaderContext } from "astro/loaders";
import { describe, expect, it } from "vitest";
import { packageManifest } from "../../../../scripts/build/package.ts";
import { lastChangeOf } from "./git-dates.ts";
import { pageSources } from "./page-sources.ts";
import {
  requiredText,
  SEARCH_FACTS_ENTRY,
  searchFacts,
  searchFactsLoader,
} from "./search-facts-loader.ts";
import { SITE_ROUTES } from "./site-routes.ts";

describe("searchFacts", () => {
  it("dates every route of the site, each its sources' last change", () => {
    const { modifiedOn } = searchFacts();
    expect(Object.keys(modifiedOn)).toEqual(SITE_ROUTES);
    for (const route of SITE_ROUTES) {
      expect(modifiedOn[route], route).toBe(lastChangeOf(pageSources(route)));
    }
  });

  it("names the library as its manifest does", () => {
    const { name, description, version, license } = packageManifest();
    expect(searchFacts().library).toEqual({ name, description, version, license });
  });
});

describe("requiredText", () => {
  const manifest = { exports: {}, name: "maplace", empty: "", count: 3 };

  it("reads a field the manifest has", () => {
    expect(requiredText(manifest, "name")).toBe("maplace");
  });

  it("throws naming a field that is missing or isn't text", () => {
    for (const field of ["license", "empty", "count"]) {
      expect(() => requiredText(manifest, field), field).toThrow(field);
    }
  });
});

describe("searchFactsLoader", () => {
  it("keeps one entry, cleared first", async () => {
    const calls: unknown[] = [];
    const store = { clear: () => calls.push("clear"), set: (entry: unknown) => calls.push(entry) };
    await searchFactsLoader().load({ store } as unknown as LoaderContext);
    expect(calls).toEqual(["clear", { id: SEARCH_FACTS_ENTRY, data: searchFacts() }]);
  });
});

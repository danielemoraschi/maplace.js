import { describe, expect, it } from "vitest";
import { docRoute, REPO_DOCS, repoDocMarkdown } from "./repo-docs.ts";
import { brokenSiteLinks, type DocPage, headingSlug } from "./site-link-targets.ts";

const locations: DocPage = {
  route: "/locations/",
  markdown: "Intro.\n\n## Markers\n\n## `<MaplaceProvider>`\n",
};

const linking = (markdown: string): DocPage[] => [locations, { route: "/element/", markdown }];

describe("brokenSiteLinks", () => {
  it("passes a link to a page, and to one of its headings", () => {
    expect(brokenSiteLinks(linking("[l](/locations/) and [m](/locations/#markers)"))).toEqual([]);
  });

  it("passes a link to a heading of the page itself", () => {
    expect(
      brokenSiteLinks([
        { ...locations, markdown: "[p](#maplaceprovider)\n\n## `<MaplaceProvider>`" },
      ]),
    ).toEqual([]);
  });

  it("passes a link to a repeated heading, numbered as the site numbers it", () => {
    const markdown = "[e](#events-1)\n\n## Events\n\n## Events";
    expect(brokenSiteLinks([{ ...locations, markdown }])).toEqual([]);
  });

  it("names a link to no page", () => {
    expect(brokenSiteLinks(linking("Intro.\n[n](/nowhere/)"))).toEqual([
      "/element/ line 2: /nowhere/ is no page",
    ]);
  });

  it("names a link to a heading the page lacks", () => {
    expect(brokenSiteLinks(linking("[m](/locations/#markerz)"))).toEqual([
      '/element/ line 1: /locations/ has no heading "#markerz"',
    ]);
  });

  it("takes only ATX headings as headings, not a line starting with #", () => {
    const markdown = "[t](#tag-line)\n\n#tag line\n\n## Tags";
    expect(brokenSiteLinks([{ ...locations, markdown }])).toEqual([
      '/locations/ line 1: /locations/ has no heading "#tag-line"',
    ]);
  });

  it("checks a link with a title", () => {
    expect(brokenSiteLinks(linking('[n](/nowhere/ "Nowhere")'))).toEqual([
      "/element/ line 1: /nowhere/ is no page",
    ]);
  });

  it("ignores links in code and links off the site", () => {
    expect(brokenSiteLinks(linking("```md\n[n](/nowhere/)\n```\n[g](https://x.y/#z)"))).toEqual([]);
  });
});

describe("headingSlug", () => {
  it.each([
    ["## Everything a 0.2 page could touch", "everything-a-02-page-could-touch"],
    ["## With a bundler", "with-a-bundler"],
    ["### Location fields", "location-fields"],
    ["## `<MaplaceProvider>`", "maplaceprovider"],
    ["## `maplace/element/google`", "maplaceelementgoogle"],
    ["## `useMaplace()`", "usemaplace"],
    ["## Using C#", "using-c"],
    ["## Closed ##  ", "closed"],
    ["## The [store](/store/#options)", "the-store"],
    ["## Closed heading ##", "closed-heading"],
  ])("gives %s the id the site gives it: %s", (heading, slug) => {
    expect(headingSlug(heading)).toBe(slug);
  });
});

describe("the site's doc pages", () => {
  const settings = {
    pin: { version: "1.2.3", integrityOf: (file: string) => `sha384-of-${file}` },
    blobBase: "https://github.com/o/r/blob/abc123/",
  };

  it("link only to pages and headings the site has", () => {
    const pages = REPO_DOCS.map((doc) => ({
      route: docRoute(doc.id),
      markdown: repoDocMarkdown(doc, settings),
    }));
    expect(brokenSiteLinks(pages)).toEqual([]);
  });
});

import { setTimeout as pause } from "node:timers/promises";
import type { Page } from "playwright";
import { beforeAll, describe, expect, it } from "vitest";
import { headCommit } from "../../../scripts/build/git.ts";
import { ROOT } from "../../../scripts/build/package.ts";
import { exampleData } from "../src/examples/example-data.ts";
import type { Provider } from "../src/examples/example-providers.ts";
import {
  EXAMPLE_GROUPS,
  EXAMPLE_SECTIONS,
  groupPath,
  HOME_GROUP,
} from "../src/examples/example-sections.ts";
import { exampleProviders } from "../src/examples/example-sources.ts";
import { REPOSITORY_URL } from "../src/site/repo-docs.ts";
import { GOOGLE_MAPS, goesToMapProvider, thirdPartyOf } from "../src/site/third-parties.ts";
import { chooseProvider, groupLink } from "./home-sections.ts";
import { ASKED, SETTLE_MS, SITE_MAP_ID, siteBuiltBeforeTests } from "./site-session.ts";
import { duplicateIds, grantConsent } from "./visitor.ts";

/** One page map per example (D23) on each of its providers, across the examples' pages. */
const PAGE_MAP_COUNT = EXAMPLE_SECTIONS.flatMap(({ name }) => exampleProviders(name)).length;

/** The heights of the maps on `provider` shown in the examples' sections. */
const shownMapHeights = (page: Page, provider: Provider) =>
  page
    .locator(
      `section.example [data-live-version]:not([hidden]) maplace-map[provider="${provider}"]`,
    )
    .evaluateAll((maps) => maps.map((map) => map.getBoundingClientRect().height));

const site = siteBuiltBeforeTests();

/** What `look` finds on each examples' page, in the groups' order, one page after another. */
async function onEveryGroupPage<Found>(look: (page: Page) => Promise<Found>): Promise<Found[]> {
  const { page, context } = await site.visitor();
  const found: Found[] = [];
  for (const group of EXAMPLE_GROUPS) {
    await page.goto(new URL(groupPath(group), site.url).href, { waitUntil: "domcontentloaded" });
    found.push(await look(page));
  }
  await context.close();
  return found;
}

/** What a page's markup says, as built: nothing laid out or run. */
const builtFacts = async (page: Page) => ({
  headings: await page.locator("section.example").evaluateAll((sections) =>
    sections.map((section) => {
      const heading = section.querySelector("h2");
      // A landmark named by its own heading.
      const named = document.getElementById(section.getAttribute("aria-labelledby") ?? "");
      return [section.id, named === heading ? heading?.textContent?.trim() : "unnamed"];
    }),
  ),
  heldMaps: await page.locator("section.example maplace-map[hold]").count(),
  dataLinks: await page
    .locator("section.example")
    .getByRole("link", { name: /\.json$/ })
    .evaluateAll((anchors) =>
      anchors.map((a) => [a.getAttribute("href"), a.getAttribute("target")]),
    ),
  idsTwice: await duplicateIds(page),
  versions: await page.evaluate(() => {
    const versions = [...document.querySelectorAll<HTMLElement>("[data-live-version]")];
    return {
      withoutNotes: versions
        .filter((version) => !version.nextElementSibling?.matches("[data-version-notes]"))
        .map(({ dataset }) => `${dataset.example} ${dataset.provider} ${dataset.liveVersion}`),
      saving: versions.filter((version) =>
        version.nextElementSibling?.querySelector("[data-saved]"),
      ).length,
      savingElsewhere: document.querySelectorAll("section:not(#polygon) [data-saved]").length,
    };
  }),
  mapIds: await page
    .locator('section.example maplace-map[provider="google"]')
    .evaluateAll((maps) =>
      maps.map((map) => [map.closest("section")?.id, map.getAttribute("map-id")]),
    ),
});

describe("the examples' pages, as built (W38)", () => {
  let pages: Awaited<ReturnType<typeof builtFacts>>[];
  beforeAll(async () => {
    pages = await onEveryGroupPage(builtFacts);
  }, 60_000);

  it("number the sections 01–17 across the pages, each its group's", () => {
    let number = 0;
    const expected = EXAMPLE_GROUPS.map(({ sections }) =>
      sections.map(({ name, title }) => {
        number += 1;
        return [name, `${String(number).padStart(2, "0")} ${title}`];
      }),
    );
    expect(pages.map(({ headings }) => headings)).toEqual(expected);
  });

  it("hold every example's map on each of its providers", () => {
    expect(pages.reduce((sum, { heldMaps }) => sum + heldMaps, 0)).toBe(PAGE_MAP_COUNT);
  });

  it("link the data an example fetches to the repo, at the commit built, in a new tab", () => {
    const links = pages.flatMap(({ dataLinks }) => dataLinks);
    expect(new Set(links.map(([, target]) => target))).toEqual(new Set(["_blank"]));
    const blob = `${REPOSITORY_URL}/blob/${headCommit(ROOT)}/`;
    expect(links.map(([href]) => href).sort()).toEqual(
      exampleData()
        .map(({ path }) => `${blob}${path}`)
        .sort(),
    );
  });

  it("use no id twice on a page", () => {
    expect(pages.flatMap(({ idsTwice }) => idsTwice)).toEqual([]);
  });

  it("follow every version with its own notes, polygon's 8 with their saved note", () => {
    const versions = pages.map((built) => built.versions);
    expect(versions.flatMap(({ withoutNotes }) => withoutNotes)).toEqual([]);
    const saving = versions.reduce((sum, { saving }) => sum + saving, 0);
    expect(saving, "polygon's versions, each with its saved note").toBe(8);
    expect(versions.reduce((sum, { savingElsewhere }) => sum + savingElsewhere, 0)).toBe(0);
  });

  it("give every example's Google map the site's map ID, but styled's own", () => {
    const notTheSite = pages.flatMap(({ mapIds }) => mapIds).filter(([, id]) => id !== SITE_MAP_ID);
    expect(notTheSite).toEqual([["styled", "DEMO_MAP_ID"]]);
  });
});

describe("the examples' pages, shown (W38)", () => {
  it("give every map a box, as a map without one never comes into view to be released", async () => {
    const heights = await onEveryGroupPage(async (page) => {
      const onMapLibre = await shownMapHeights(page, "maplibre");
      await chooseProvider(page, "Google");
      const onGoogle = await shownMapHeights(page, "google");
      await chooseProvider(page, "MapLibre");
      return [...onMapLibre, ...onGoogle];
    });
    expect(heights.flat()).toHaveLength(PAGE_MAP_COUNT);
    expect(heights.flat().filter((height) => height === 0)).toEqual([]);
  }, 60_000);

  it("once the maps are on, send every request off the site to a third party the privacy page names", async () => {
    const visit = await site.visitor();
    const { page, offsite, mapProviders, mapsJsRequests, context } = visit;
    await grantConsent(page, site.url);
    const shownMaps = page.locator("section.example maplace-map").filter({ visible: true });
    /** Every group in turn, switched to in place from the bar, scrolled past its shown maps. */
    const scrollPastEveryGroupsMaps = async () => {
      for (const group of EXAMPLE_GROUPS) {
        await groupLink(page, group.label).click();
        await page.waitForURL(new URL(groupPath(group), site.url).href);
        for (const map of await shownMaps.all()) await map.scrollIntoViewIfNeeded();
      }
      await pause(SETTLE_MS);
    };
    // Every map on MapLibre, the pages' first provider: none of it billed by Google.
    await scrollPastEveryGroupsMaps();
    await expect.poll(() => mapProviders().length, ASKED).toBeGreaterThan(0);
    expect(mapProviders().filter((url) => thirdPartyOf(url) === GOOGLE_MAPS)).toEqual([]);
    expect(new URL(page.url()).pathname, "the last group shown").not.toBe(groupPath(HOME_GROUP));
    await chooseProvider(page, "Google");
    await scrollPastEveryGroupsMaps();
    await expect.poll(() => mapsJsRequests().length, ASKED).toBeGreaterThan(0);
    await pause(SETTLE_MS);
    expect(offsite().filter((url) => !goesToMapProvider(url))).toEqual([]);
    await context.close();
  }, 120_000);
});

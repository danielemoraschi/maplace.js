import { readFileSync } from "node:fs";
import { setTimeout as pause } from "node:timers/promises";
import type { Page } from "playwright";
import { beforeAll, describe, expect, it } from "vitest";
import { exampleData } from "../src/examples/example-data.ts";
import type { Provider } from "../src/examples/example-providers.ts";
import {
  EXAMPLE_GROUPS,
  EXAMPLE_PAGE_ENTRIES,
  EXAMPLE_SECTIONS,
  groupHeading,
  groupPath,
  pageHeading,
} from "../src/examples/example-sections.ts";
import { exampleFile, exampleProviders } from "../src/examples/example-sources.ts";
import { GOOGLE_MAPS, goesToMapProvider, thirdPartyOf } from "../src/site/third-parties.ts";
import { chooseProvider } from "./home-sections.ts";
import {
  ASKED,
  SETTLE_MS,
  SITE_MAP_ID,
  siteBuiltBeforeTests,
  visitEach,
  visitingPages,
} from "./site-session.ts";
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

/** The examples' folder, from here. */
const EXAMPLES = "../../../packages/maplace/examples/";

const site = siteBuiltBeforeTests();

/** Every example's page, in its groups' order. */
const EXAMPLE_PAGES = EXAMPLE_PAGE_ENTRIES.map(({ path }) => path);

/** What `look` finds on each page at `routes`, one page after another. */
async function onEveryPage<Found>(
  routes: readonly string[],
  look: (page: Page) => Promise<Found>,
): Promise<Found[]> {
  const { page, context } = await site.visitor();
  const found = await visitEach(page, site.url, routes, () => look(page));
  await context.close();
  return found;
}

/** The heights of every map an example's page shows, on each provider in turn. */
async function mapHeights(page: Page): Promise<number[]> {
  const onMapLibre = await shownMapHeights(page, "maplibre");
  await chooseProvider(page, "Google");
  const onGoogle = await shownMapHeights(page, "google");
  await chooseProvider(page, "MapLibre");
  return [...onMapLibre, ...onGoogle];
}

/** What a page's markup says, as built: nothing laid out or run. */
const builtFacts = async (page: Page) => ({
  // The section, named by its own heading, the page's H1; the line above it and the paragraph under it.
  heading: await page.locator("section.example").evaluate((section) => {
    const heading = section.querySelector("h1");
    const named = document.getElementById(section.getAttribute("aria-labelledby") ?? "");
    const text = (element: Element | null | undefined) =>
      element?.textContent?.replace(/\s+/g, " ").trim();
    return {
      id: section.id,
      words: named === heading ? text(heading) : "unnamed",
      above: text(heading?.previousElementSibling),
      under: text(heading?.nextElementSibling),
      h1s: document.querySelectorAll("h1").length,
    };
  }),
  heldMaps: await page.locator("section.example maplace-map[hold]").count(),
  dataLinks: await page
    .locator("section.example")
    .getByRole("link", { name: /\.json$/ })
    .evaluateAll((anchors) =>
      anchors.map((a) => [a.getAttribute("href"), a.getAttribute("target")]),
    ),
  stylesheetLinks: await page
    .locator("section.example")
    .getByRole("link", { name: /\.css$/ })
    .evaluateAll((anchors) =>
      anchors.map((a) => [a.closest("section")?.id, a.getAttribute("href"), a.textContent]),
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

describe("the examples' pages, as built and before consent (W38)", () => {
  let pages: (Awaited<ReturnType<typeof builtFacts>> & { mapHeights: number[] })[];
  beforeAll(
    async () => {
      // The markup first, as built; then the maps' boxes, each provider shown in turn.
      pages = await onEveryPage(EXAMPLE_PAGES, async (page) => ({
        ...(await builtFacts(page)),
        mapHeights: await mapHeights(page),
      }));
    },
    visitingPages(EXAMPLE_PAGES.length * 2),
  );

  it("head each example's page with its title in task words, its category above, unnumbered, its summary under (W63)", () => {
    expect(pages.map(({ heading }) => heading)).toEqual(
      EXAMPLE_PAGE_ENTRIES.map(({ group, section }) => ({
        id: section.name,
        words: pageHeading(section.title),
        above: group.label,
        under: section.summary,
        h1s: 1,
      })),
    );
  });

  it(
    "head each hub with its heading in task words, its intro under it (W63)",
    async () => {
      const hubs = await onEveryPage(EXAMPLE_GROUPS.map(groupPath), async (page) => ({
        words: await page.locator("h1").textContent(),
        intro: await page.locator("h1 + p").textContent(),
      }));
      expect(hubs).toEqual(
        EXAMPLE_GROUPS.map((group) => ({ words: groupHeading(group), intro: group.intro })),
      );
    },
    visitingPages(EXAMPLE_GROUPS.length),
  );

  it("give every map a box, as a map without one never comes into view to be released", () => {
    const heights = pages.flatMap(({ mapHeights }) => mapHeights);
    expect(heights).toHaveLength(PAGE_MAP_COUNT);
    expect(heights.filter((height) => height === 0)).toEqual([]);
  });

  it("hold every example's map on each of its providers", () => {
    expect(pages.reduce((sum, { heldMaps }) => sum + heldMaps, 0)).toBe(PAGE_MAP_COUNT);
  });

  it("link the data an example fetches to the site's own copy, in a new tab", async () => {
    const links = pages.flatMap(({ dataLinks }) => dataLinks);
    expect(new Set(links.map(([, target]) => target))).toEqual(new Set(["_blank"]));
    expect(links.map(([href]) => href).sort()).toEqual(
      exampleData()
        .map(({ name }) => `/examples/data/${name}.json`)
        .sort(),
    );
    const served = await fetch(new URL("/examples/data/points-4k.json", site.url));
    expect(served.headers.get("content-type")).toMatch(/^application\/json/);
    expect(await served.text()).toBe(
      readFileSync(new URL(`${EXAMPLES}data/points-4k.json`, import.meta.url), "utf8"),
    );
  });

  it("link the stylesheet an example's versions link to the site's copy, once, under its section", async () => {
    expect(pages.flatMap(({ stylesheetLinks }) => stylesheetLinks)).toEqual([
      ["popups", "/examples/styles/popups.css", "popups.css"],
      ["choropleth", "/examples/styles/choropleth.css", "choropleth.css"],
      ["whats-on", "/examples/styles/whats-on.css", "whats-on.css"],
      ["team", "/examples/styles/team.css", "team.css"],
    ]);
    for (const file of ["popups.css", "choropleth.css", "whats-on.css", "team.css"]) {
      const served = await fetch(new URL(`/examples/styles/${file}`, site.url));
      expect(served.headers.get("content-type"), file).toMatch(/^text\/css/);
      expect(await served.text(), file).toBe(exampleFile("styles", file));
    }
  });

  it("serve an example's photo, byte for byte, as WebP", async () => {
    const served = await fetch(new URL("/examples/data/photos/colosseum.webp", site.url));
    expect(served.headers.get("content-type")).toMatch(/^image\/webp/);
    const file = readFileSync(new URL(`${EXAMPLES}data/photos/colosseum.webp`, import.meta.url));
    expect(Buffer.from(await served.arrayBuffer()).equals(file)).toBe(true);
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
  it(
    "once the maps are on, send every request off the site to a third party the privacy page names",
    async () => {
      const visit = await site.visitor();
      const { page, offsite, mapProviders, mapsJsRequests, context } = visit;
      await grantConsent(page, site.url);
      const shownMaps = page.locator("section.example maplace-map").filter({ visible: true });
      /** Every example's page in turn, scrolled past its shown maps. */
      const scrollPastEveryExamplesMaps = async () => {
        await visitEach(
          page,
          site.url,
          EXAMPLE_PAGES,
          async () => {
            for (const map of await shownMaps.all()) await map.scrollIntoViewIfNeeded();
          },
          "load",
        );
        await pause(SETTLE_MS);
      };
      // Every map on MapLibre, the pages' first provider: none of it billed by Google.
      await scrollPastEveryExamplesMaps();
      await expect.poll(() => mapProviders().length, ASKED).toBeGreaterThan(0);
      expect(mapProviders().filter((url) => thirdPartyOf(url) === GOOGLE_MAPS)).toEqual([]);
      await chooseProvider(page, "Google");
      await scrollPastEveryExamplesMaps();
      await expect.poll(() => mapsJsRequests().length, ASKED).toBeGreaterThan(0);
      await pause(SETTLE_MS);
      expect(offsite().filter((url) => !goesToMapProvider(url))).toEqual([]);
      await context.close();
    },
    visitingPages(EXAMPLE_PAGES.length * 2),
  );
});

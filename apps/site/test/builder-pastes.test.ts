import type { MaplaceMapElement } from "maplace/element";
import type { Locator, Page } from "playwright";
import { describe, expect, it } from "vitest";
import { PREVIEW_FIT_PADDING } from "../src/scripts/builder-page.ts";
import { BUILDER_PAGE } from "../src/site/footer-pages.ts";
import { pageMapState } from "./home-sections.ts";
import { ON_MAPLIBRE, siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { SETTLE_MS } from "./site-session.ts";
import { DESKTOP, placeholder } from "./visitor.ts";

const site = siteOnMapLibreBeforeTests();

const USER_PASTE =
  "name,lat,lng,title\nRome,41.9028,12.4964,my title\nMilan,45.4642,9.19\nVenice,45.4408,12.3155";
const WITH_START = `{ start: 2, locations: [
  { lat: 41.9, lng: 12.5, title: "Rome" },
  { lat: 45.46, lng: 9.19, title: "Milan" },
] }`;

async function openBuilder() {
  const visit = await site.visitor({ viewport: DESKTOP });
  await visit.page.goto(new URL(BUILDER_PAGE.route, site.url).href);
  await status(visit.page).filter({ hasText: /./ }).waitFor();
  return visit;
}

const status = (page: Page) => page.locator("[data-builder-status]");
const code = (page: Page) => page.locator("[data-builder-code]");
const shownMap = (page: Page): Locator => page.locator('[data-provider="maplibre"] maplace-map');

async function paste(page: Page, text: string): Promise<void> {
  await page.locator("[data-builder-paste]").fill(text);
  await page.waitForTimeout(SETTLE_MS);
}

const titlesOn = (map: Locator) =>
  map.evaluate((element) => (element as MaplaceMapElement).locations.map(({ title }) => title));

const snapshotOf = (map: Locator) =>
  map.evaluate((element) => {
    const { selectedId, view } = (element as MaplaceMapElement).maplace.getSnapshot();
    return { selectedId, view };
  });

describe("what the builder does with a paste", () => {
  it("opens on a sample naming title, and takes the user's paste", async () => {
    const { page, context } = await openBuilder();
    expect(await page.locator("[data-builder-paste]").inputValue()).toMatch(/^title,lat,lng\n/);
    await paste(page, USER_PASTE);
    expect(await titlesOn(shownMap(page))).toEqual(["my title", "Milan", "Venice"]);
    const written = await code(page).textContent();
    for (const title of ["my title", "Milan", "Venice"]) expect(written).toContain(title);
    expect(await page.locator("[data-builder-notes-list]").textContent()).toContain("fills title");
    await context.close();
  }, 30_000);

  it("selects a config's start on the preview, before and after consent, and a paste without one clears it", async () => {
    const { page, context, errors } = await openBuilder();
    const map = shownMap(page);
    await paste(page, WITH_START);
    await placeholder(page).click();
    await expect
      .poll(() => pageMapState(page.locator('[data-provider="maplibre"]')), ON_MAPLIBRE)
      .toBe("ready");
    expect(await snapshotOf(map)).toMatchObject({ selectedId: "2", view: { kind: "location" } });
    await paste(page, "lat,lng\n1,2\n3,4");
    const cleared = await snapshotOf(map);
    expect(cleared.selectedId).toBeUndefined();
    expect(cleared.view).toMatchObject({ kind: "fit-all", padding: PREVIEW_FIT_PADDING });
    await paste(page, WITH_START);
    expect(await snapshotOf(map)).toMatchObject({ selectedId: "2", view: { kind: "location" } });
    expect(errors()).toEqual([]);
    await context.close();
  }, 40_000);

  it("reads a config in parentheses", async () => {
    const { page, context } = await openBuilder();
    await paste(page, `(${WITH_START})`);
    expect(await status(page).textContent()).toBe("Read as a 0.2 config: 2 locations");
    await context.close();
  }, 30_000);

  it("notes a polygon's popups and how to keep them", async () => {
    const { page, context } = await openBuilder();
    const note = page.locator("[data-builder-text-note]");
    expect(await note.isVisible()).toBe(false);
    await paste(
      page,
      JSON.stringify([
        {
          type: "polygon",
          html: "<b>area</b>",
          path: [
            { lat: 1, lng: 2 },
            { lat: 3, lng: 4 },
            { lat: 5, lng: 6 },
          ],
        },
      ]),
    );
    expect(await note.isVisible()).toBe(true);
    await note.locator("a").click();
    await page.waitForURL("**/element/#properties-and-methods");
    expect(await page.locator("#properties-and-methods").count()).toBe(1);
    await context.close();
  }, 30_000);
});

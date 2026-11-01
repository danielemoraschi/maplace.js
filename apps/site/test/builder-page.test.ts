import type { MaplaceMapElement } from "maplace/element";
import type { Locator, Page } from "playwright";
import { describe, expect, it } from "vitest";
import { PREVIEW_FIT_PADDING } from "../src/scripts/builder-page.ts";
import { BUILDER_PAGE, PRIVACY_PAGE } from "../src/site/footer-pages.ts";
import { pageMapState } from "./home-sections.ts";
import { ON_MAPLIBRE, siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { AS_SHIPPED, ASKED, SETTLE_MS } from "./site-session.ts";
import { boxOf, DESKTOP, PHONE, placeholder } from "./visitor.ts";
import { choosePreviewOnGoogle } from "./written-snippet.ts";

const site = siteOnMapLibreBeforeTests();
const ICON_HOST = "icons.example";
const WITH_ICON = `name,lat,lng,icon\nOslo,59.91,10.75,https://${ICON_HOST}/a.png\nBergen,60.39,5.32,`;

async function openBuilder(options: Parameters<typeof site.visitor>[0] = {}) {
  const visit = await site.visitor({ viewport: DESKTOP, ...options });
  await visit.page.goto(new URL(BUILDER_PAGE.route, site.url).href);
  await status(visit.page).filter({ hasText: /./ }).waitFor();
  return visit;
}

const MAPLIBRE_VERSION = (page: Page) => page.locator('[data-provider="maplibre"]');
const status = (page: Page) => page.locator("[data-builder-status]");
const code = (page: Page) => page.locator("[data-builder-code]");
const copyButton = (page: Page) => page.locator("[data-builder-copy]");
const shownMap = (page: Page, provider = "maplibre"): Locator =>
  page.locator(`[data-provider="${provider}"] maplace-map`);

async function paste(page: Page, text: string): Promise<void> {
  await page.locator("[data-builder-paste]").fill(text);
  await page.waitForTimeout(SETTLE_MS);
}

const titlesOn = (map: Locator) =>
  map.evaluate((element) => (element as MaplaceMapElement).locations.map(({ title }) => title));

describe("the builder before consent", () => {
  it("writes a snippet from the sample and from a paste with no request off the machine before consent", async () => {
    const { page, context, offsite } = await openBuilder();
    expect(await code(page).textContent()).toContain("Rome");
    await paste(page, WITH_ICON);
    expect(await status(page).textContent()).toBe("Read as CSV: 2 locations");
    expect(await code(page).textContent()).toContain(ICON_HOST);
    expect(await placeholder(page).isVisible()).toBe(true);
    expect(offsite()).toEqual([]);
    await context.close();
  }, 30_000);

  it("draws what was pasted before consent, set before the element was defined", async () => {
    const { page, context, errors } = await openBuilder();
    await paste(page, WITH_ICON);
    await placeholder(page).click();
    const map = shownMap(page);
    await expect
      .poll(() => pageMapState(page.locator('[data-provider="maplibre"]')), ON_MAPLIBRE)
      .toBe("ready");
    expect(await titlesOn(map)).toEqual(["Oslo", "Bergen"]);
    expect(await map.getByText("Oslo", { exact: true }).count()).toBeGreaterThan(0);
    expect(errors()).toEqual([]);
    await context.close();
  }, 40_000);

  it("after consent asks only OpenFreeMap, never a pasted icon's host", async () => {
    const { page, context, offsite } = await openBuilder();
    await paste(page, WITH_ICON);
    await placeholder(page).click();
    await expect
      .poll(() => pageMapState(page.locator('[data-provider="maplibre"]')), ON_MAPLIBRE)
      .toBe("ready");
    expect(offsite().length).toBeGreaterThan(0);
    expect(offsite().filter((url) => !url.includes("openfreemap.org"))).toEqual([]);
    await context.close();
  }, 40_000);
});

describe("the builder's map", () => {
  const contains = (map: Locator, lat: number, lng: number) =>
    map.evaluate(
      (element, point) => {
        const { bounds } = (element as MaplaceMapElement).maplace.getSnapshot().viewport ?? {};
        if (bounds === undefined) return false;
        return (
          point.lat <= bounds.north &&
          point.lat >= bounds.south &&
          point.lng <= bounds.east &&
          point.lng >= bounds.west
        );
      },
      { lat, lng },
    );

  it("moves to a paste made after the map opened, and after a refusal", async () => {
    const { page, context } = await openBuilder();
    await placeholder(page).click();
    const map = shownMap(page);
    await expect.poll(() => contains(map, 45.46, 9.19), ON_MAPLIBRE).toBe(true);
    await paste(page, "name,lat,lng\nDenver,39.74,-104.99\nBoston,42.36,-71.06");
    await expect.poll(() => contains(map, 39.74, -104.99), ON_MAPLIBRE).toBe(true);
    await paste(page, "nothing here");
    await paste(page, "name,lat,lng\nTokyo,35.68,139.69\nOsaka,34.69,135.5");
    await expect.poll(() => contains(map, 35.68, 139.69), ON_MAPLIBRE).toBe(true);
    expect(await titlesOn(map)).toEqual(["Tokyo", "Osaka"]);
    await context.close();
  }, 60_000);

  it("moves to a paste made while it was hidden, once it shows again", async () => {
    const { page, context } = await openBuilder({ google: "stubbed" });
    await placeholder(page).click();
    const map = shownMap(page);
    await expect.poll(() => contains(map, 45.46, 9.19), ON_MAPLIBRE).toBe(true);
    await choosePreviewOnGoogle(page);
    await paste(page, "name,lat,lng\nDenver,39.74,-104.99\nBoston,42.36,-71.06");
    await page
      .getByRole("group", { name: "Preview and write the snippet for" })
      .getByRole("radio", { name: "MapLibre", exact: true })
      .check();
    await expect.poll(() => contains(map, 39.74, -104.99), ON_MAPLIBRE).toBe(true);
    await context.close();
  }, 60_000);

  it("asks for room around the pins on the first view, defined late, and after a paste", async () => {
    const { page, context } = await openBuilder();
    const paddingAsked = () =>
      shownMap(page).evaluate((element) => {
        const { view } = (element as MaplaceMapElement).maplace.getSnapshot();
        return view.kind === "fit-all" ? view.padding : undefined;
      });
    await placeholder(page).click();
    await expect.poll(() => pageMapState(MAPLIBRE_VERSION(page)), ON_MAPLIBRE).toBe("ready");
    expect(await paddingAsked()).toBe(PREVIEW_FIT_PADDING);
    await paste(page, "name,lat,lng\nDenver,39.74,-104.99\nBoston,42.36,-71.06");
    expect(await paddingAsked()).toBe(PREVIEW_FIT_PADDING);
    await context.close();
  }, 40_000);

  it("on Google asks for Maps JS only after consent and writes the placeholder key, never the site's", async () => {
    const { page, context, mapsJsRequests } = await openBuilder({ google: "stubbed" });
    await choosePreviewOnGoogle(page);
    await page.waitForTimeout(SETTLE_MS);
    expect(mapsJsRequests()).toEqual([]);
    const written = (await code(page).textContent()) ?? "";
    expect(written).toContain('api-key="YOUR_KEY"');
    expect(written).toContain("maplace-element.iife.js");
    expect(written).not.toContain(AS_SHIPPED.SITE_MAPS_KEY);
    await placeholder(page).click();
    await expect.poll(() => mapsJsRequests().length, ASKED).toBeGreaterThan(0);
    await context.close();
  }, 40_000);

  it("opens on the provider kept from earlier in the visit, its snippet too", async () => {
    const { page, context } = await openBuilder();
    await choosePreviewOnGoogle(page);
    await page.goto(new URL("/", site.url).href);
    await page.goto(new URL(BUILDER_PAGE.route, site.url).href);
    await status(page).filter({ hasText: /./ }).waitFor();
    expect(await page.locator('[data-builder-preview] [data-provider="google"]').isVisible()).toBe(
      true,
    );
    expect(await code(page).textContent()).toContain('api-key="YOUR_KEY"');
    await context.close();
  }, 30_000);

  it("never runs pasted html", async () => {
    const { page, context, fetched } = await openBuilder();
    const html = `<img src="/ran.png" onerror="window.ran = true">Hello<script>window.ran = true</script>`;
    await paste(
      page,
      `{ locations: [{ lat: 1, lon: 2, title: "A", html: '${html}' }, { lat: 3, lon: 4, title: "B" }], controls_type: "list", controls_on_map: false }`,
    );
    await placeholder(page).click();
    const map = shownMap(page);
    await expect
      .poll(() => pageMapState(page.locator('[data-provider="maplibre"]')), ON_MAPLIBRE)
      .toBe("ready");
    await map.evaluate((e) => (e as MaplaceMapElement).maplace.select("1"));
    const popup = page.locator(".maplibregl-popup");
    await popup.waitFor();
    expect(await popup.textContent()).toContain("Hello");
    expect(await popup.textContent()).not.toContain("window.ran");
    expect(await popup.locator("img").count()).toBe(0);
    expect(await page.evaluate(() => "ran" in window)).toBe(false);
    expect(fetched("/ran.png")).toBe(false);
    await context.close();
  }, 40_000);
});

describe("the builder's preview of a 0.2 config", () => {
  it("shows the fit-all entry the snippet writes, in 0.2's words", async () => {
    const { page, context } = await openBuilder();
    await placeholder(page).click();
    await paste(
      page,
      `{ controls_type: "list", controls_on_map: false, view_all_text: "Everywhere",
          locations: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }] }`,
    );
    expect(await code(page).textContent()).toContain('fit-all fit-all-label="Everywhere"');
    expect(await shownMap(page).locator(".maplace-fit-all").textContent()).toBe("Everywhere");
    await context.close();
  }, 60_000);
});

describe("the builder's refusals", () => {
  it("names what it refuses, with Copy off only when nothing can be written", async () => {
    const { page, context, errors } = await openBuilder();
    await paste(page, "[{ lat: 1, lng: 2, icon: function () { return 1; } }]");
    expect(await page.locator("[data-builder-notes-list]").textContent()).toContain("a function");
    expect(await copyButton(page).isEnabled()).toBe(true);
    await paste(
      page,
      "{ locations: [{ lat: 1, lon: 2 }], map_options: { mapTypeId: google.maps.MapTypeId.ROADMAP } }",
    );
    expect(await page.locator("[data-builder-notes-list]").textContent()).toContain(
      "google.maps.MapTypeId.ROADMAP",
    );
    expect(await copyButton(page).isEnabled()).toBe(true);
    await paste(page, "{ locations: Locs }");
    expect(await status(page).textContent()).toContain("Locs");
    expect(await copyButton(page).isEnabled()).toBe(false);
    expect(errors()).toEqual([]);
    await context.close();
  }, 30_000);
});

describe("the builder's Copy", () => {
  it("copies the snippet", async () => {
    const { page, context } = await openBuilder();
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await copyButton(page).click();
    await page.getByText("Copied", { exact: true }).waitFor();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(await code(page).textContent());
    await context.close();
  }, 30_000);
});

describe("the builder's layout", () => {
  const manyPlaces = [
    "name,lat,lng",
    ...Array.from(
      { length: 40 },
      (_, index) => `Place with a rather long name ${index},${index},${index}`,
    ),
  ].join("\n");

  it.each([
    ["a phone", PHONE, true],
    ["a desktop", DESKTOP, false],
  ])(
    "lays out without sideways scroll on %s",
    async (_name, viewport, stacked) => {
      const { page, context } = await openBuilder({ viewport });
      await paste(page, manyPlaces);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width,
      );
      const paste01 = await boxOf(page.locator("[data-builder-paste]"));
      const frame = await boxOf(page.locator("[data-builder-preview] .map-frame"));
      if (stacked) expect(frame.y).toBeGreaterThan(paste01.y + paste01.height);
      else expect(frame.x).toBeGreaterThan(paste01.x + paste01.width);
      const pre = code(page);
      expect(await pre.getAttribute("data-long")).not.toBeNull();
      const lastLineShown = await pre.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
        return element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
      });
      expect(lastLineShown).toBe(true);
      await context.close();
    },
    30_000,
  );
});

describe("the builder's code box", () => {
  it("takes focus on a phone, where its long script line scrolls sideways", async () => {
    const { page, context } = await openBuilder({ viewport: PHONE });
    expect(await code(page).evaluate((element) => element.tabIndex)).toBe(0);
    await context.close();
  }, 30_000);
});

describe("other pages", () => {
  it("load none of the builder's code", async () => {
    const visit = await site.visitor({ viewport: DESKTOP });
    const asked: string[] = [];
    visit.page.on("request", (request) => asked.push(request.url()));
    await visit.page.goto(new URL(PRIVACY_PAGE.route, site.url).href, { waitUntil: "load" });
    expect(asked.filter((url) => url.includes("builder"))).toEqual([]);
    await visit.context.close();
  }, 30_000);
});

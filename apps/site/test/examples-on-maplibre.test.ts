import { describe, expect, it } from "vitest";
import { EXAMPLE_SECTIONS } from "../src/examples/example-sections.ts";
import { exampleProviders } from "../src/examples/example-sources.ts";
import { VERSION_LABELS } from "../src/examples/example-versions.ts";
import { mayAskBeforeConsent } from "../src/site/third-parties.ts";
import {
  mapLibreDrawn,
  mapLibreVersionIn,
  missingStylesheetWarnings,
  pageMapState,
  recordLoadStates,
  siteWorkers,
} from "./drawn-on-maplibre.ts";
import { ON_MAPLIBRE, SECTION_MS, siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { ASKED, SETTLE_MS } from "./site-session.ts";
import {
  chooseProvider,
  chooseTab,
  chooseVersion,
  leaveOnlySection,
  loadMapsButtons,
  OPENFREEMAP_STYLES,
  providerVersionIn,
  sectionOf,
} from "./visitor.ts";

/** A version as the section's switch offers it. */
type VersionChoice = (typeof VERSION_LABELS)[number];

const LIBERTY = `${OPENFREEMAP_STYLES}liberty`;
const DARK = `${OPENFREEMAP_STYLES}dark`;

/**
 * Each section with MapLibre versions, its versions in the order the test opens them: the first
 * readies MapLibre for the page, in turn the element or a vanilla or React version's module.
 */
const SECTIONS = EXAMPLE_SECTIONS.filter(({ name }) =>
  exampleProviders(name).includes("maplibre"),
).map(({ name }, index) => {
  const turn = index % VERSION_LABELS.length;
  const order = [...VERSION_LABELS.slice(turn), ...VERSION_LABELS.slice(0, turn)];
  return { name, order, first: order[0] as VersionChoice };
});

const site = siteOnMapLibreBeforeTests();

/** A visitor on the home page with only `name`'s section left, scrolled to it. */
async function visitSection(name: string) {
  const visit = await site.visitor();
  await visit.page.goto(new URL(`/#${name}`, site.url).href);
  await leaveOnlySection(visit.page, name);
  return { ...visit, section: await sectionOf(visit.page, name) };
}

// Every section's page, vanilla and React versions on MapLibre, on the site as built and served,
// OpenFreeMap's styles answered from the machine: each map made, its style asked for, the page's
// map ready, maplibre-gl's worker running from the site, nothing thrown or warned. Unlike Google's
// twin, the three versions' markers aren't compared: MapLibre draws them where the page can't
// count them alike, and the package's runners hold the three to the same map.
describe("the site's examples on MapLibre", () => {
  describe.concurrent("each section", () => {
    it.for(SECTIONS)(
      "draws $name on MapLibre, its $first.label version readying MapLibre",
      { timeout: SECTION_MS },
      async ({ name, order }, { expect }) => {
        const { page, context, errors, offsite, mapsJsRequests, section } =
          await visitSection(name);
        const warnings = missingStylesheetWarnings(page);

        /** Waits for `kind`'s map to be made on MapLibre, its default style asked for. */
        async function drawnOnMapLibre({ kind, label }: VersionChoice, askedBefore: number) {
          const version = mapLibreVersionIn(section, kind);
          const waitingFor = (what: string) => polled(name, `its ${label} version's ${what}`);
          if (kind === "html") {
            await expect.poll(() => pageMapState(version), waitingFor("state")).toBe("ready");
          }
          await expect.poll(() => mapLibreDrawn(version), waitingFor("map")).toBe(true);
          await expect
            .poll(() => offsite().slice(askedBefore), waitingFor("style"))
            .toContain(LIBERTY);
        }

        await chooseProvider(page, name, "MapLibre");
        for (const [index, version] of order.entries()) {
          const askedBefore = offsite().length;
          await chooseVersion(page, name, version.label);
          if (index === 0) await loadMapsButtons(section).click();
          await drawnOnMapLibre(version, askedBefore);
        }
        const otherwise = offsite().filter(
          (url) => !mayAskBeforeConsent(url) && !url.startsWith(OPENFREEMAP_STYLES),
        );
        expect(otherwise, "asked offsite but OpenFreeMap's styles").toEqual([]);
        expect(mapsJsRequests()).toEqual([]);
        await expect
          .poll(() => siteWorkers(page, site.url).length, polled(name, "maplibre-gl's worker"))
          .toBeGreaterThan(0);
        expect(await section.locator("[data-map-failure]").isVisible()).toBe(false);
        expect(await section.locator("[data-failed], [data-failure-note]").count()).toBe(0);
        expect(errors()).toEqual([]);
        expect(warnings()).toEqual([]);
        expect(await section.locator(".maplibregl-map").count(), "maps made").toBe(3);
        await context.close();
      },
    );
  });

  it("opens styled's page on OpenFreeMap's dark style from its toggle, answered locally", async () => {
    const { page, context, offsite, errors, section } = await visitSection("styled");
    await chooseProvider(page, "styled", "MapLibre");
    await loadMapsButtons(section).click();
    const version = mapLibreVersionIn(section, "html");
    await expect.poll(() => pageMapState(version), ON_MAPLIBRE).toBe("ready");
    const states = await recordLoadStates(version);
    await section.getByRole("button", { name: "Dark theme" }).click();
    await expect.poll(() => offsite().at(-1), ON_MAPLIBRE).toBe(DARK);
    // Ready again after loading anew: the map opened on the dark style, not still on the light.
    await expect.poll(states, ON_MAPLIBRE).toEqual(expect.arrayContaining(["loading"]));
    await expect.poll(() => states().then((seen) => seen.at(-1)), ON_MAPLIBRE).toBe("ready");
    expect(await section.locator("[data-map-failure]").isVisible()).toBe(false);
    expect(errors()).toEqual([]);
    await context.close();
  }, 30_000);
});

describe("the provider switch", () => {
  it("sits at the right end of the section's heading row, in reach from every tab", async () => {
    const { page, context, section } = await visitSection("simple");
    const group = section.getByRole("group", { name: "Run on" });
    const [title, box, frame] = await Promise.all([
      section.getByRole("heading", { level: 2 }).boundingBox(),
      group.boundingBox(),
      section.boundingBox(),
    ]);
    if (title === null || box === null || frame === null) throw new Error("nothing laid out");
    expect(box.y).toBeLessThan(title.y + title.height);
    expect(box.y + box.height).toBeGreaterThan(title.y);
    expect(Math.round(box.x + box.width)).toBe(Math.round(frame.x + frame.width));
    await section.getByRole("tab", { name: "HTML" }).click();
    await chooseProvider(page, "simple", "MapLibre");
    const html = section.getByRole("tabpanel").filter({ visible: true });
    expect(await html.getByText("examples/simple/maplibre/page.html").isVisible()).toBe(true);
    // The chosen segment's ground slides under it.
    const ground = group.locator("span[aria-hidden]");
    const chosen = await group.locator("label").filter({ hasText: "MapLibre" }).boundingBox();
    await expect.poll(async () => (await ground.boundingBox())?.x).toBe(chosen?.x);
    expect((await ground.boundingBox())?.width).toBe(chosen?.width);
    await context.close();
  }, 30_000);

  it("stays level with the title beside a summary that wraps, at 1024 px", async () => {
    const { page, context } = await site.visitor({ viewport: { width: 1024, height: 800 } });
    await page.goto(site.url);
    const section = await sectionOf(page, "markers");
    const title = await section.getByRole("heading", { level: 2 }).boundingBox();
    const box = await section.getByRole("group", { name: "Run on" }).boundingBox();
    if (title === null || box === null) throw new Error("nothing laid out");
    expect(box.y).toBeLessThan(title.y + title.height);
    await context.close();
  }, 30_000);

  it("shows MapLibre's version once chosen, keeping the version", async () => {
    const { page, context, section } = await visitSection("simple");
    await chooseVersion(page, "simple", "Vanilla");
    await chooseProvider(page, "simple", "MapLibre");
    expect(await mapLibreVersionIn(section, "vanilla").isVisible()).toBe(true);
    expect(await providerVersionIn(section, "google", "vanilla").isHidden()).toBe(true);
    await context.close();
  }, 30_000);

  it("shows MapLibre's files in the code tabs, with no Google loader", async () => {
    const { page, context } = await visitSection("simple");
    await chooseProvider(page, "simple", "MapLibre");
    const section = await chooseTab(page, "simple", "Vanilla");
    const shown = (text: string) =>
      section.getByRole("tabpanel").getByText(text).filter({ visible: true }).count();
    expect(await shown("examples/simple/maplibre/vanilla.ts")).toBe(1);
    expect(await shown("examples/simple/vanilla.ts")).toBe(0);
    expect(await shown("Google's bootstrap loader")).toBe(0);
    await context.close();
  }, 30_000);

  it("offers route on Google only, saying why", async () => {
    const { page, context, section } = await visitSection("route");
    expect(await section.getByRole("radio", { name: "MapLibre" }).isDisabled()).toBe(true);
    const group = section.getByRole("group", { name: "Run on" });
    const reason = page.locator(`#${await group.getAttribute("aria-describedby")}`);
    expect(await reason.textContent()).toBe("MapLibre has no routing.");
    expect(await reason.isVisible()).toBe(true);
    await context.close();
  }, 30_000);

  it("asks OpenFreeMap nothing before consent, a MapLibre version chosen", async () => {
    const { page, context, mapProviders, fetched } = await visitSection("big");
    await chooseProvider(page, "big", "MapLibre");
    await chooseVersion(page, "big", "React");
    await page.waitForTimeout(SETTLE_MS);
    expect(mapProviders()).toEqual([]);
    expect(fetched("/points-4k.json")).toBe(false);
    await context.close();
  }, 30_000);

  it("leaves a running MapLibre version alone when Google's Maps JS fails", async () => {
    const { page, context, mapsJsRequests, section } = await visitSection("simple");
    await chooseProvider(page, "simple", "MapLibre");
    await chooseVersion(page, "simple", "Vanilla");
    await loadMapsButtons(section).click();
    const onMapLibre = mapLibreVersionIn(section, "vanilla");
    await expect.poll(() => onMapLibre.getAttribute("data-started"), ON_MAPLIBRE).toBe("");
    await chooseProvider(page, "simple", "Google");
    const onGoogle = providerVersionIn(section, "google", "vanilla");
    await expect.poll(() => onGoogle.getAttribute("data-failed"), ASKED).toBe("");
    expect(mapsJsRequests().length).toBeGreaterThan(0);
    expect(await onMapLibre.getAttribute("data-failed")).toBeNull();
    await context.close();
  }, 30_000);

  it("frames MapLibre's map as Google's", async () => {
    const { page, context, section } = await visitSection("simple");
    await chooseProvider(page, "simple", "MapLibre");
    await loadMapsButtons(section).click();
    const map = mapLibreVersionIn(section, "html").locator(".maplace-maplibre-map");
    await expect.poll(() => map.count(), ON_MAPLIBRE).toBe(1);
    const border = await map.evaluate((element) => getComputedStyle(element).borderTopWidth);
    expect(border).toBe("2px");
    await context.close();
  }, 30_000);

  it("leaves a list on MapLibre's map out of the site's side panel", async () => {
    const { page, context, section } = await visitSection("markers");
    await chooseProvider(page, "markers", "MapLibre");
    await loadMapsButtons(section).click();
    const list = mapLibreVersionIn(section, "html").locator(".maplace-list-view");
    await expect.poll(() => list.count(), ON_MAPLIBRE).toBe(1);
    const margin = await list.evaluate((element) => getComputedStyle(element).marginInlineStart);
    expect(margin).toBe("0px");
    await context.close();
  }, 30_000);

  it("sets an example's own checkbox apart on a white panel, as its side list, on both providers", async () => {
    const { context, section } = await visitSection("menu");
    const grounds = await section
      .locator(".version label")
      .filter({ hasText: "North only" })
      .evaluateAll((labels) => labels.map((label) => getComputedStyle(label).backgroundColor));
    expect(grounds.length).toBeGreaterThanOrEqual(2);
    expect(new Set(grounds)).toEqual(new Set(["rgb(255, 255, 255)"]));
    await context.close();
  }, 30_000);

  it("keeps every section's switch within a 375 px screen, route's reason too", async () => {
    const { page, context } = await site.visitor({ viewport: { width: 375, height: 812 } });
    await page.goto(site.url);
    const overflowing = await page
      .getByRole("group", { name: "Run on" })
      .evaluateAll(
        (switches) =>
          switches.filter(({ scrollWidth, clientWidth }) => scrollWidth > clientWidth).length,
      );
    expect(overflowing).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );
    await context.close();
  }, 30_000);
});

/** A poll's options for `name`'s section on MapLibre, its message saying what it waits for. */
function polled(name: string, what: string) {
  return { ...ON_MAPLIBRE, message: `${name} on MapLibre: ${what}` };
}

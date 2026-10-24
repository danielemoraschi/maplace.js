import { describe, expect, it } from "vitest";
import {
  OPENFREEMAP_DARK as DARK,
  OPENFREEMAP_LIBERTY as LIBERTY,
  OPENFREEMAP_STYLES,
} from "../../../packages/maplace/src/testing/examples/openfreemap-styles.ts";
import { EXAMPLE_SECTIONS } from "../src/examples/example-sections.ts";
import { exampleProviders } from "../src/examples/example-sources.ts";
import { VERSION_LABELS } from "../src/examples/example-versions.ts";
import { mayAskBeforeConsent } from "../src/site/third-parties.ts";
import {
  mapLibreDrawn,
  mapLibreVersionIn,
  mapLibreView,
  missingStylesheetWarnings,
  recordLoadStates,
  siteWorkers,
} from "./drawn-on-maplibre.ts";
import {
  chooseProvider,
  chooseVersion,
  pageMapState,
  type VersionChoice,
  versionsInTurn,
  visitSection,
} from "./home-sections.ts";
import { expectLeftOpensAsShown, LEFT_WHILE_LOADING } from "./left-while-loading.ts";
import { ON_MAPLIBRE, SECTION_MS, siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { loadMapsButtons } from "./visitor.ts";

/**
 * Each section with MapLibre versions, its versions in the order the test opens them: the first
 * readies MapLibre for the page, in turn the element or a vanilla or React version's module.
 */
const SECTIONS = EXAMPLE_SECTIONS.filter(({ name }) =>
  exampleProviders(name).includes("maplibre"),
).map(({ name }, index) => {
  const order = versionsInTurn(index);
  return { name, order, first: order[0] };
});

const site = siteOnMapLibreBeforeTests();

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
        const { page, context, errors, offsite, mapsJsRequests, section } = await visitSection(
          site,
          name,
        );
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
        expect(await section.locator(".maplibregl-map").count(), "maps made").toBe(
          VERSION_LABELS.length,
        );
        await context.close();
      },
    );
  });

  it("opens styled's page on OpenFreeMap's dark style from its toggle, answered locally", async () => {
    const { page, context, offsite, errors, section } = await visitSection(site, "styled");
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

describe("MapLibre's maps in the site's frame", () => {
  it("frames MapLibre's map as Google's", async () => {
    const { page, context, section } = await visitSection(site, "simple");
    await chooseProvider(page, "simple", "MapLibre");
    await loadMapsButtons(section).click();
    const map = mapLibreVersionIn(section, "html").locator(".maplace-maplibre-map");
    await expect.poll(() => map.count(), ON_MAPLIBRE).toBe(1);
    const border = await map.evaluate((element) => getComputedStyle(element).borderTopWidth);
    expect(border).toBe("2px");
    await context.close();
  }, 30_000);

  it("leaves a list on MapLibre's map out of the site's side panel", async () => {
    const { page, context, section } = await visitSection(site, "markers");
    await chooseProvider(page, "markers", "MapLibre");
    await loadMapsButtons(section).click();
    const list = mapLibreVersionIn(section, "html").locator(".maplace-list-view");
    await expect.poll(() => list.count(), ON_MAPLIBRE).toBe(1);
    const margin = await list.evaluate((element) => getComputedStyle(element).marginInlineStart);
    expect(margin).toBe("0px");
    await context.close();
  }, 30_000);

  it("sets an example's own checkbox apart on a white panel, as its side list, on both providers", async () => {
    const { context, section } = await visitSection(site, "menu");
    const grounds = await section
      .locator(".version label")
      .filter({ hasText: "North only" })
      .evaluateAll((labels) =>
        labels.map((label) => {
          const provider = label.closest<HTMLElement>("[data-provider]")?.dataset.provider;
          return `${provider} ${getComputedStyle(label).backgroundColor}`;
        }),
      );
    expect(new Set(grounds)).toEqual(
      new Set(["google rgb(255, 255, 255)", "maplibre rgb(255, 255, 255)"]),
    );
    await context.close();
  }, 30_000);
});

// W23: a version left while its scripts load is made hidden, in a frame with no size; shown
// again, it must open on the view it would have had.
describe("a version left while it loads, on MapLibre", () => {
  it.for(LEFT_WHILE_LOADING)(
    "opens $name on the view it would have had",
    { timeout: 60_000 },
    async (leftAndShown) => {
      const { page, context, section, errors } = await visitSection(site, "styled");
      await chooseProvider(page, "styled", "MapLibre");
      await expectLeftOpensAsShown({ page, section, example: "styled" }, leftAndShown, {
        versionIn: (kind) => mapLibreVersionIn(section, kind),
        viewOf: mapLibreView,
        timeout: ON_MAPLIBRE.timeout,
      });
      expect(errors()).toEqual([]);
      await context.close();
    },
  );
});

/** A poll's options for `name`'s section on MapLibre, its message saying what it waits for. */
function polled(name: string, what: string) {
  return { ...ON_MAPLIBRE, message: `${name} on MapLibre: ${what}` };
}

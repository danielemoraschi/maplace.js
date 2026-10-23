import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import type { VersionKind } from "../src/examples/example-versions.ts";
import { mapLibreDrawn, mapLibreVersionIn } from "./drawn-on-maplibre.ts";
import {
  chooseProvider,
  chooseVersion,
  leaveOnlySection,
  providerVersionIn,
} from "./home-sections.ts";
import { ON_MAPLIBRE } from "./maplibre-session.ts";
import { ASKED, siteBuiltBeforeTests } from "./site-session.ts";
import { addedByBootstrap, footerToggle, openHome, placeholder } from "./visitor.ts";

const site = siteBuiltBeforeTests();

/** simple's `kind` version on Google. */
const simpleOnGoogle = (page: Page, kind: VersionKind) =>
  providerVersionIn(page.locator("section#simple"), "google", kind);

/** The button simple's failure note offers when a reload mends its failure. */
const reloadButton = (page: Page) =>
  page.locator("section#simple").getByRole("button", { name: "Reload the page" });

/** A version module's chunk: the site's build names each after its file. */
const VANILLA_CHUNK = /\/_astro\/vanilla\.[^/]+\.js$/;

describe("a map's failure note", () => {
  it("says when its own bootstrap's Maps JS didn't load for a version", async () => {
    const { page, context, mapsJsRequests } = await site.visitor();
    await openHome(page, site.url);
    // Only simple's section left, its Bundler version chosen before consent: its page map never
    // asks for Maps JS, so only the version's bootstrap does.
    await leaveOnlySection(page, "simple");
    await chooseVersion(page, "simple", "Bundler");
    await footerToggle(page).click();
    await page.locator("#simple-vanilla-map").scrollIntoViewIfNeeded();
    const vanilla = simpleOnGoogle(page, "vanilla");
    await expect.poll(() => vanilla.getAttribute("data-failed"), ASKED).toBe("maps-js");
    const mapsTags = mapsJsRequests();
    expect(mapsTags.length).toBeGreaterThan(0);
    expect(mapsTags.filter((url) => !addedByBootstrap(url))).toEqual([]);
    await context.close();
  }, 30_000);

  it("says when Maps JS didn't load for a version, the page's tag having failed first", async () => {
    const { page, context, mapsJsRequests } = await site.visitor();
    await openHome(page, site.url);
    await placeholder(page).click();
    await expect.poll(() => mapsJsRequests().length, ASKED).toBeGreaterThan(0);
    const html = simpleOnGoogle(page, "html");
    await expect.poll(() => html.getAttribute("data-reload-mends"), ASKED).toBe("");
    expect(await reloadButton(page).isVisible()).toBe(true);
    await chooseVersion(page, "simple", "Bundler");
    const vanilla = simpleOnGoogle(page, "vanilla");
    await expect.poll(() => vanilla.getAttribute("data-failed"), ASKED).toBe("maps-js");
    const note = page.locator("section#simple [data-map-failure]");
    expect(await note.textContent()).toMatch(/^The map couldn't load: Google Maps didn't load/);
    expect(await note.isVisible()).toBe(true);
    expect(await reloadButton(page).isVisible()).toBe(true);
    // A script version's adapter would share the page's failed Maps JS: it says so too.
    await chooseVersion(page, "simple", "Script");
    const script = simpleOnGoogle(page, "script");
    await expect.poll(() => script.getAttribute("data-failed"), ASKED).toBe("maps-js");
    expect(await note.isVisible()).toBe(true);
    await context.close();
  }, 30_000);

  it("offers a reload when a version's script didn't load, which starts it", async () => {
    const { page, context } = await site.visitor({ openFreeMap: "local" });
    let refused = false;
    await page.route(VANILLA_CHUNK, (route) => {
      if (refused) return route.fallback();
      refused = true;
      return route.abort();
    });
    await openHome(page, site.url);
    await leaveOnlySection(page, "simple");
    await chooseProvider(page, "simple", "MapLibre");
    await chooseVersion(page, "simple", "Bundler");
    await footerToggle(page).click();
    const section = page.locator("section#simple");
    await section.scrollIntoViewIfNeeded();
    const vanilla = mapLibreVersionIn(section, "vanilla");
    await expect.poll(() => vanilla.getAttribute("data-failed"), ASKED).toBe("script");
    expect(await section.locator("[data-map-failure]").textContent()).toBe(
      "The map couldn't load: its script didn't load. The network?",
    );
    await Promise.all([page.waitForEvent("load"), reloadButton(page).click()]);
    await chooseProvider(page, "simple", "MapLibre");
    await chooseVersion(page, "simple", "Bundler");
    await section.scrollIntoViewIfNeeded();
    await expect.poll(() => vanilla.getAttribute("data-started"), ON_MAPLIBRE).toBe("");
    await expect.poll(() => mapLibreDrawn(vanilla), ON_MAPLIBRE).toBe(true);
    expect(await vanilla.getAttribute("data-failed")).toBeNull();
    await context.close();
  }, 60_000);
});

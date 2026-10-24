import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import type { Provider } from "../src/examples/example-providers.ts";
import type { VersionKind } from "../src/examples/example-versions.ts";
import { mapLibreDrawn, mapLibreVersionIn } from "./drawn-on-maplibre.ts";
import { expectNotedInTurn, type InTurn } from "./failure-note-checks.ts";
import { ON_GOOGLE } from "./google-session.ts";
import {
  chooseProvider,
  chooseVersion,
  leaveOnlySection,
  providerVersionIn,
  sectionOf,
} from "./home-sections.ts";
import { ON_MAPLIBRE } from "./maplibre-session.ts";
import { ASKED, siteBuiltBeforeTests } from "./site-session.ts";
import {
  addedByBootstrap,
  footerToggle,
  openHome,
  placeholder,
  type VisitorOptions,
} from "./visitor.ts";

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

  it("says why a MapLibre version's map didn't load: OpenFreeMap blocked", async () => {
    const { page, context, section } = await sectionFrom({}, simpleFromScript("maplibre"));
    await expectNotedInTurn(
      page,
      section,
      simpleInTurn("maplibre", ["script", "vanilla", "react"]),
      {
        failed: "provider-load-failed",
        note: "OpenFreeMap's map didn't load. A blocker, or the network?",
        reload: true,
      },
    );
    await context.close();
  }, 60_000);

  it("says OpenFreeMap refused a MapLibre version's style", async () => {
    const visit = await sectionFrom({ openFreeMap: "forbidden" }, simpleFromScript("maplibre"));
    await expectNotedInTurn(
      visit.page,
      visit.section,
      simpleInTurn("maplibre", ["script", "vanilla", "react"]),
      {
        failed: "provider-auth-failed",
        note: "OpenFreeMap refused the map's style.",
        reload: false,
      },
    );
    await visit.context.close();
  }, 60_000);

  it("says why a Google version's map didn't load: its libraries failed", async () => {
    // The Script version first: its adapter adds Maps JS itself, which the module versions then
    // find on the page, with no bootstrap to wait on the stub.
    const visit = await sectionFrom({ google: "failing" }, simpleFromScript("google"));
    const inTurn = simpleInTurn("google", ["script", "vanilla", "react"]);
    await expectNotedInTurn(visit.page, visit.section, inTurn, {
      failed: "provider-load-failed",
      note: "Google Maps didn't load. A blocker, or the network?",
      reload: true,
    });
    await visit.context.close();
  }, 60_000);

  it("says when a script version's program throws as it runs", async () => {
    const { context, section } = await sectionFrom(
      { openFreeMap: "local" },
      {
        ...simpleFromScript("maplibre"),
        // What its program mounts on gone, its first call throws.
        beforeConsent: (page) =>
          page.evaluate(() => document.querySelector("#simple-maplibre-script-map")?.remove()),
      },
    );
    const script = mapLibreVersionIn(section, "script");
    await expect.poll(() => script.getAttribute("data-failed"), ON_MAPLIBRE).toBe("script");
    expect(await section.locator("[data-map-failure]").isVisible()).toBe(true);
    await context.close();
  }, 60_000);

  it("shows only the failure when a version's map fails while its start still waits", async () => {
    const { context, section } = await sectionFrom(
      {},
      {
        example: "mixed",
        provider: "maplibre",
        version: "Bundler",
        // mixed's module makes its map, then waits on its first group's data: held, the version
        // stays starting while OpenFreeMap, refused, fails its map.
        beforeConsent: (page) => page.route("**/mixed-a.json", () => {}),
      },
    );
    const vanilla = mapLibreVersionIn(section, "vanilla");
    await expect
      .poll(() => vanilla.getAttribute("data-failed"), ON_MAPLIBRE)
      .toBe("provider-load-failed");
    expect(await vanilla.getAttribute("data-starting")).toBe("");
    expect(await section.locator("[data-map-failure]").isVisible()).toBe(true);
    expect(await section.locator(".map-note.loading").isVisible(), "loading shown").toBe(false);
    await context.close();
  }, 60_000);
});

/** A section opened on its own, a provider and a version chosen, before consenting. */
interface Opening {
  readonly example: string;
  readonly provider: Provider;
  /** The version's label, chosen before consent: a hidden page map never loads. */
  readonly version: string;
  /** What the test does to the page last before consenting. */
  readonly beforeConsent?: (page: Page) => Promise<unknown>;
}

/** simple on `provider`, its Script version chosen before consent. */
const simpleFromScript = (provider: Provider): Opening => ({
  example: "simple",
  provider,
  version: "Script",
});

/** A visitor seeing the site as `options` say, on `opening`'s section alone, then consenting. */
async function sectionFrom(options: VisitorOptions, opening: Opening) {
  const { example, provider, version, beforeConsent } = opening;
  const visit = await site.visitor(options);
  const { page } = visit;
  await openHome(page, site.url);
  await leaveOnlySection(page, example);
  if (provider === "maplibre") await chooseProvider(page, example, "MapLibre");
  await chooseVersion(page, example, version);
  await beforeConsent?.(page);
  await footerToggle(page).click();
  return { ...visit, section: await sectionOf(page, example) };
}

/** How long each provider's version may take to fail. */
const ON_PROVIDER: Readonly<Record<Provider, number>> = {
  google: ON_GOOGLE.timeout,
  maplibre: ON_MAPLIBRE.timeout,
};

/** simple's `kinds` on `provider`, in turn. */
const simpleInTurn = (provider: Provider, kinds: readonly VersionKind[]): InTurn => ({
  example: "simple",
  provider,
  kinds,
  timeout: ON_PROVIDER[provider],
});

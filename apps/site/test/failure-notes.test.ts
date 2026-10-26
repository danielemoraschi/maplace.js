import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import type { VersionKind } from "../src/examples/example-versions.ts";
import { mapLibreDrawn, mapLibreVersionIn } from "./drawn-on-maplibre.ts";
import { expectNoteAlone, expectNotedInTurn, simpleInTurn } from "./failure-note-checks.ts";
import { sectionFrom, simpleFromScript } from "./failure-openings.ts";
import {
  chooseProvider,
  chooseVersion,
  leaveOnlySection,
  providerVersionIn,
  shownNotes,
} from "./home-sections.ts";
import { ON_MAPLIBRE } from "./maplibre-session.ts";
import { MAPLIBRE_GL_CHUNKS, VANILLA_CHUNK } from "./site-chunks.ts";
import { ASKED, siteBuiltBeforeTests } from "./site-session.ts";
import { addedByBootstrap, footerToggle, openHome, placeholder } from "./visitor.ts";

const site = siteBuiltBeforeTests();

/** simple's `kind` version on Google. */
const simpleOnGoogle = (page: Page, kind: VersionKind) =>
  providerVersionIn(page.locator("section#simple"), "google", kind);

/** The button simple's failure note offers when a reload mends its failure. */
const reloadButton = (page: Page) =>
  page.locator("section#simple").getByRole("button", { name: "Reload the page" });

describe("a map's failure note", () => {
  it("says when its own bootstrap's Maps JS didn't load for a version", async () => {
    const { page, context, mapsJsRequests } = await site.visitor();
    await openHome(page, site.url);
    // Only simple's section left, its Bundler version chosen before consent: its page map never
    // asks for Maps JS, so only the version's bootstrap does.
    await leaveOnlySection(page, "simple");
    await chooseProvider(page, "Google");
    await chooseVersion(page, "simple", "Bundler");
    await footerToggle(page).click();
    await page.locator("#simple-vanilla-map").scrollIntoViewIfNeeded();
    const vanilla = simpleOnGoogle(page, "vanilla");
    await expect
      .poll(() => vanilla.getAttribute("data-failed"), ASKED)
      .toBe("provider-load-failed");
    const mapsTags = mapsJsRequests();
    expect(mapsTags.length).toBeGreaterThan(0);
    expect(mapsTags.filter((url) => !addedByBootstrap(url))).toEqual([]);
    await context.close();
  }, 30_000);

  it("says when Maps JS didn't load for a version, the page's tag having failed first", async () => {
    const { page, context, mapsJsRequests } = await site.visitor();
    await openHome(page, site.url);
    await chooseProvider(page, "Google");
    await placeholder(page).click();
    await expect.poll(() => mapsJsRequests().length, ASKED).toBeGreaterThan(0);
    const html = simpleOnGoogle(page, "html");
    await expect.poll(() => html.getAttribute("data-reload-mends"), ASKED).toBe("");
    expect(await reloadButton(page).isVisible()).toBe(true);
    await chooseVersion(page, "simple", "Bundler");
    const vanilla = simpleOnGoogle(page, "vanilla");
    await expect
      .poll(() => vanilla.getAttribute("data-failed"), ASKED)
      .toBe("provider-load-failed");
    const note = shownNotes(page.locator("section#simple")).locator("[data-map-failure]");
    expect(await note.textContent()).toMatch(/^The map couldn't load: Google Maps didn't load/);
    expect(await note.isVisible()).toBe(true);
    expect(await reloadButton(page).isVisible()).toBe(true);
    // A script version's adapter would share the page's failed Maps JS: it says so too.
    await chooseVersion(page, "simple", "Script");
    const script = simpleOnGoogle(page, "script");
    await expect.poll(() => script.getAttribute("data-failed"), ASKED).toBe("provider-load-failed");
    expect(await note.isVisible()).toBe(true);
    await context.close();
  }, 30_000);

  it("offers a reload when a version's module didn't load, which starts it", async () => {
    const { page, context } = await site.visitor({ openFreeMap: "local" });
    let refused = false;
    await page.route(VANILLA_CHUNK, (route) => {
      if (refused) return route.fallback();
      refused = true;
      return route.abort();
    });
    await openHome(page, site.url);
    await leaveOnlySection(page, "simple");
    await chooseVersion(page, "simple", "Bundler");
    await footerToggle(page).click();
    const section = page.locator("section#simple");
    await section.scrollIntoViewIfNeeded();
    const vanilla = mapLibreVersionIn(section, "vanilla");
    await expect.poll(() => vanilla.getAttribute("data-failed"), ASKED).toBe("module");
    await expectNoteAlone(section, {
      note: "its code didn't load or run.",
      reload: true,
    });
    await Promise.all([page.waitForEvent("load"), reloadButton(page).click()]);
    await chooseVersion(page, "simple", "Bundler");
    await section.scrollIntoViewIfNeeded();
    await expect.poll(() => vanilla.getAttribute("data-started"), ON_MAPLIBRE).toBe("");
    await expect.poll(() => mapLibreDrawn(vanilla), ON_MAPLIBRE).toBe(true);
    expect(await vanilla.getAttribute("data-failed")).toBeNull();
    await context.close();
  }, 60_000);

  it("says why a MapLibre version's map didn't load: OpenFreeMap blocked", async () => {
    const { page, context, section } = await sectionFrom(site, {}, simpleFromScript("maplibre"));
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
    const visit = await sectionFrom(
      site,
      { openFreeMap: "forbidden" },
      simpleFromScript("maplibre"),
    );
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
    const visit = await sectionFrom(site, { google: "failing" }, simpleFromScript("google"));
    const inTurn = simpleInTurn("google", ["script", "vanilla", "react"]);
    await expectNotedInTurn(visit.page, visit.section, inTurn, {
      failed: "provider-load-failed",
      note: "Google Maps didn't load. A blocker, or the network?",
      reload: true,
    });
    await visit.context.close();
  }, 60_000);

  // A version's own imports bring maplibre-gl: a module version's import, a script version's
  // `Maplace`, fails with it, in that version's words.
  it.for([
    { label: "Bundler", kind: "vanilla", failed: "module", note: "its code didn't load or run." },
    {
      label: "Script",
      kind: "script",
      failed: "script",
      note: "its script didn't load. The network?",
    },
  ] as const)(
    "offers a reload when maplibre-gl didn't load for a $label version",
    { timeout: 60_000 },
    async ({ label, kind, failed, note }) => {
      const { context, section } = await sectionFrom(
        site,
        { openFreeMap: "local" },
        {
          example: "simple",
          provider: "maplibre",
          version: label,
          beforeConsent: (page) => page.route(MAPLIBRE_GL_CHUNKS, (route) => route.abort()),
        },
      );
      const version = mapLibreVersionIn(section, kind);
      await expect.poll(() => version.getAttribute("data-failed"), ASKED).toBe(failed);
      await expectNoteAlone(section, { note, reload: true });
      await context.close();
    },
  );

  it("says when a script version's program throws as it runs", async () => {
    const { context, section } = await sectionFrom(
      site,
      { openFreeMap: "local" },
      {
        ...simpleFromScript("maplibre"),
        // What its program mounts on gone, its first call throws.
        beforeConsent: (page) =>
          page.evaluate(() => document.querySelector("#simple-maplibre-script-map")?.remove()),
      },
    );
    const script = mapLibreVersionIn(section, "script");
    await expect.poll(() => script.getAttribute("data-failed"), ON_MAPLIBRE).toBe("program");
    await expectNoteAlone(section, {
      note: "its program threw an error as it ran.",
      reload: false,
    });
    await context.close();
  }, 60_000);

  it("shows only the failure when a version's map fails while its start still waits", async () => {
    const { context, section } = await sectionFrom(
      site,
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
    const notes = shownNotes(section);
    expect(await notes.locator("[data-map-failure]").isVisible()).toBe(true);
    expect(await notes.locator(".map-note.loading").isVisible(), "loading shown").toBe(false);
    await context.close();
  }, 60_000);
});

describe("a Google version's start", () => {
  it("asks for Maps JS beside its module, not once the module is in", async () => {
    let moduleEnded = false;
    let mapsJsBeforeModuleEnded = false;
    const { context } = await sectionFrom(
      site,
      { google: "stubbed" },
      {
        example: "simple",
        provider: "google",
        version: "Bundler",
        beforeConsent: async (page) => {
          page.on("request", (request) => {
            if (addedByBootstrap(request.url()) && !moduleEnded) mapsJsBeforeModuleEnded = true;
          });
          page.on("requestfinished", (request) => {
            if (VANILLA_CHUNK.test(request.url())) moduleEnded = true;
          });
          // The module held: Maps JS asked for only once it's in is requested after it ends.
          await page.route(VANILLA_CHUNK, async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            await route.fallback();
          });
        },
      },
    );
    await expect.poll(() => moduleEnded, ASKED).toBe(true);
    expect(mapsJsBeforeModuleEnded, "Maps JS requested before the module ended").toBe(true);
    await context.close();
  }, 30_000);
});

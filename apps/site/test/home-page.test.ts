import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import {
  chooseProvider,
  chooseTab,
  chooseVersion,
  sectionPage,
  shownNotes,
  visitSection,
} from "./home-sections.ts";
import { recordAnimations } from "./recorded-animations.ts";
import { ASKED, SITE_MAP_ID, siteBuiltBeforeTests } from "./site-session.ts";
import { footerToggle, openHome, placeholder } from "./visitor.ts";

const site = siteBuiltBeforeTests();

describe("the home page's links", () => {
  it("has GitHub's star button in place of its link, GitHub's count refused or not", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    await expect.poll(() => page.locator("a.github-button").count(), ASKED).toBe(0);
    await context.close();
  }, 30_000);
});

describe("the home page's headings and install box", () => {
  it("offers each provider's npm command and pinned script", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url, { waitUntil: "domcontentloaded" });
    expect(await page.locator("#npm-install-google").textContent()).toBe("npm install maplace");
    expect(await page.locator("#npm-install-maplibre").textContent()).toBe(
      "npm install maplace maplibre-gl",
    );
    for (const provider of ["google", "maplibre"]) {
      expect(await page.locator(`#pinned-script-${provider}`).textContent()).toContain(
        "integrity=",
      );
    }
    await context.close();
  }, 30_000);
});

describe("Data & routes' examples", () => {
  it("runs a page's scripts as its map opens: route's stops, big's points", async () => {
    const { page, context, fetched } = await site.visitor();
    await openHome(page, site.url, sectionPage("route"));
    await placeholder(page).click();
    await chooseProvider(page, "Google");
    await page.locator("#route-map").scrollIntoViewIfNeeded();
    await expect
      .poll(
        () =>
          page.evaluate(
            () => (document.getElementById("route-map") as { route?: unknown } | null)?.route,
          ),
        ASKED,
      )
      .toMatchObject({ stops: ["milan", "zurich", "paris", "munich"], via: ["zurich"] });
    await page.locator("#big-map").scrollIntoViewIfNeeded();
    await expect.poll(() => fetched("/points-4k.json"), ASKED).toBe(true);
    await context.close();
  }, 30_000);

  it("runs the chosen version once consented, its map in a box", async () => {
    const { page, context, fetched } = await site.visitor({ google: "stubbed" });
    await openHome(page, site.url, sectionPage("route"));
    // Chosen before consent, so big's page map, hidden, is never released: only its React
    // version can fetch the points.
    await chooseProvider(page, "Google");
    await chooseVersion(page, "route", "Bundler");
    await chooseVersion(page, "big", "React");
    await footerToggle(page).click();
    await page.locator("#route-vanilla-map").scrollIntoViewIfNeeded();
    await expect
      .poll(() => page.locator('#route-vanilla-list [role="listbox"]').count(), ASKED)
      .toBe(1);
    const box = await page.locator("#route-vanilla-map").boundingBox();
    expect(box?.height).toBeGreaterThan(0);
    await page.locator("#big-react-root").scrollIntoViewIfNeeded();
    await expect.poll(() => fetched("/points-4k.json"), ASKED).toBe(true);
    const reactMap = await page.locator("#big-react-root .map").boundingBox();
    expect(reactMap?.height).toBeGreaterThan(0);
    await context.close();
  }, 30_000);
});

describe("the home page's code tabs", () => {
  it("shows a host's Google loader as one closed line, opened on a click", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    await chooseProvider(page, "Google");
    const section = await chooseTab(page, "simple", "Bundler");
    const loader = section.getByRole("group").filter({ hasText: "Google's bootstrap loader" });
    expect(await loader.getAttribute("open")).toBeNull();
    expect(await loader.getByText("importLibrary").isVisible()).toBe(false);
    await loader.getByText("Google's bootstrap loader").click();
    expect(await loader.getByText("importLibrary").isVisible()).toBe(true);
    await context.close();
  }, 30_000);

  it("fades in the panel a tab shows, the one left hidden at once, unless asked for less motion", async () => {
    const { page, context } = await site.visitor();
    const animated = await recordAnimations(page);
    await page.goto(site.url);
    await chooseTab(page, "simple", "HTML");
    expect(await animated()).toEqual(["example-simple-html"]);
    expect(await page.locator("#example-simple-map").isHidden()).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await chooseTab(page, "simple", "React");
    expect(await page.locator("#example-simple-react").isVisible()).toBe(true);
    expect(await animated()).toEqual(["example-simple-html"]);
    await context.close();
  }, 30_000);
});

describe("the site's map ID", () => {
  it("is in the scripts the vanilla and React versions run on", async () => {
    const scripts = await readdir(join(site.dir, "_astro"));
    const texts = await Promise.all(
      scripts
        .filter((file) => file.endsWith(".js"))
        .map((file) => readFile(join(site.dir, "_astro", file), "utf8")),
    );
    expect(texts.some((text) => text.includes(SITE_MAP_ID))).toBe(true);
  });
});

describe("polygon's saved note", () => {
  /** Calls the `save` polygon's versions call with an edit, as one would. */
  const save = (page: Page, title: string) =>
    page.evaluate((saved) => {
      const pageGlobals = globalThis as unknown as { save(location: object): void };
      pageGlobals.save({ id: "park", title: saved, path: [1, 2, 3] });
    }, title);

  it("says what the shown version saved, each version keeping its own", async () => {
    const { page, context, section } = await visitSection(site, "polygon");
    await chooseVersion(page, "polygon", "Bundler");
    const saved = shownNotes(section).locator("[data-saved]");
    await save(page, "Park");
    expect(await saved.textContent()).toBe("Saved: Park, 3 points.");
    expect(await saved.isVisible()).toBe(true);
    await chooseVersion(page, "polygon", "Script");
    expect(await saved.isVisible(), "the Script version saved nothing").toBe(false);
    const bundlerSave = section.getByText("Saved: Park, 3 points.");
    expect(await bundlerSave.isVisible(), "the hidden Bundler version's save").toBe(false);
    await chooseVersion(page, "polygon", "Bundler");
    expect(await saved.textContent()).toBe("Saved: Park, 3 points.");
    expect(await saved.isVisible()).toBe(true);
    await context.close();
  }, 30_000);
});

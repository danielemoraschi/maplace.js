import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { headCommit } from "../../../scripts/build/git.ts";
import { ROOT } from "../../../scripts/build/package.ts";
import { exampleData } from "../src/examples/example-data.ts";
import type { Provider } from "../src/examples/example-providers.ts";
import { EXAMPLE_SECTIONS } from "../src/examples/example-sections.ts";
import { exampleProviders } from "../src/examples/example-sources.ts";
import { REPOSITORY_URL } from "../src/site/repo-docs.ts";
import { chooseTab, chooseVersion } from "./home-sections.ts";
import { recordAnimations } from "./recorded-animations.ts";
import { ASKED, SITE_MAP_ID, siteBuiltBeforeTests } from "./site-session.ts";
import { footerToggle, openHome, placeholder } from "./visitor.ts";

/** One page map per example on the home page (D23) on each of its providers. */
const PAGE_MAP_COUNT = EXAMPLE_SECTIONS.flatMap(({ name }) => exampleProviders(name)).length;

/** The heights of the maps on `provider` shown in the examples' sections. */
const shownMapHeights = (page: Page, provider: Provider) =>
  page
    .locator(
      `section.example [data-live-version]:not([hidden]) maplace-map[provider="${provider}"]`,
    )
    .evaluateAll((maps) => maps.map((map) => map.getBoundingClientRect().height));

const site = siteBuiltBeforeTests();

describe("the home page's links", () => {
  it("has GitHub's star button in place of its link, GitHub's count refused or not", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    await expect.poll(() => page.locator("a.github-button").count(), ASKED).toBe(0);
    await context.close();
  }, 30_000);

  it("links the data an example fetches to the repo, at the commit built, in a new tab", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url, { waitUntil: "domcontentloaded" });
    const links = await page
      .locator("section.example")
      .getByRole("link", { name: /\.json$/ })
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href")));
    const targets = await page
      .locator("section.example")
      .getByRole("link", { name: /\.json$/ })
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("target")));
    expect(new Set(targets)).toEqual(new Set(["_blank"]));
    const blob = `${REPOSITORY_URL}/blob/${headCommit(ROOT)}/`;
    expect(links.sort()).toEqual(
      exampleData()
        .map(({ path }) => `${blob}${path}`)
        .sort(),
    );
    await context.close();
  }, 30_000);
});

describe("the home page's headings and install box", () => {
  it("names each section by its number and title", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url, { waitUntil: "domcontentloaded" });
    for (const [index, { name }] of EXAMPLE_SECTIONS.entries()) {
      const section = page.locator(`section#${name}`);
      const heading = (await section.getByRole("heading", { level: 2 }).textContent())?.trim();
      const number = String(index + 1).padStart(2, "0");
      expect(heading).toMatch(new RegExp(`^${number} \\S`));
      expect(await page.getByRole("region", { name: heading ?? "" }).count()).toBe(1);
    }
    await context.close();
  }, 30_000);

  it("offers each provider's npm command and pinned script, each with a Copy button", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url, { waitUntil: "domcontentloaded" });
    expect(await page.locator("#npm-install-google").textContent()).toBe("npm install maplace");
    expect(await page.locator("#npm-install-maplibre").textContent()).toBe(
      "npm install maplace maplibre-gl",
    );
    for (const kind of ["npm-install", "pinned-script"]) {
      for (const provider of ["google", "maplibre"]) {
        const id = `${kind}-${provider}`;
        const copy = page.locator(`button[data-copy="${id}"]`);
        expect(await copy.getAttribute("aria-describedby")).toBe(`${id}-label`);
      }
    }
    await context.close();
  }, 30_000);
});

describe("the home page's examples", () => {
  it("shows every example's map on each of its providers, held", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    expect(await page.locator("section.example maplace-map[hold]").count()).toBe(PAGE_MAP_COUNT);
    await context.close();
  }, 30_000);

  it("gives every map a box, as a map without one never comes into view to be released", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    const onGoogle = await shownMapHeights(page, "google");
    // Clicked, not set: setting `checked` fires no `change`, and the switch would reveal nothing.
    await page.evaluate(() => {
      for (const radio of document.querySelectorAll<HTMLInputElement>(
        'input[value="maplibre"]:not(:disabled)',
      )) {
        radio.click();
      }
    });
    const onMapLibre = await shownMapHeights(page, "maplibre");
    expect(onGoogle.length + onMapLibre.length).toBe(PAGE_MAP_COUNT);
    expect([...onGoogle, ...onMapLibre].filter((height) => height === 0)).toEqual([]);
    await context.close();
  }, 30_000);

  it("uses no id twice, with every example's versions on one page", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url);
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll("[id]")].map(({ id }) => id),
    );
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    await context.close();
  }, 30_000);

  it("runs a page's scripts as its map opens: route's stops, big's points", async () => {
    const { page, context, fetched } = await site.visitor();
    await openHome(page, site.url);
    await placeholder(page).click();
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
    await openHome(page, site.url);
    // Chosen before consent, so big's page map, hidden, is never released: only its React
    // version can fetch the points.
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
  it("is every example page's map ID, but where the page sets its own", async () => {
    const { page, context } = await site.visitor();
    await page.goto(site.url, { waitUntil: "domcontentloaded" });
    const mapIds = await page
      .locator('section.example maplace-map[provider="google"]')
      .evaluateAll((maps) => maps.map((map) => map.getAttribute("map-id")));
    const styled = await page
      .locator('section#styled maplace-map[provider="google"]')
      .getAttribute("map-id");
    expect(styled).toBe("DEMO_MAP_ID");
    expect(mapIds.filter((id) => id !== SITE_MAP_ID)).toEqual(["DEMO_MAP_ID"]);
    await context.close();
  }, 30_000);

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

import { describe, expect, it } from "vitest";
import { mapLibreVersionIn } from "./drawn-on-maplibre.ts";
import {
  chooseProvider,
  chooseTab,
  chooseVersion,
  providerVersionIn,
  sectionOf,
  visitSection,
} from "./home-sections.ts";
import { ON_MAPLIBRE, siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { ASKED, SETTLE_MS } from "./site-session.ts";
import { loadMapsButtons } from "./visitor.ts";

const site = siteOnMapLibreBeforeTests();

describe("the provider switch", () => {
  it("sits at the right end of the section's heading row, in reach from every tab", async () => {
    const { page, context, section } = await visitSection(site, "simple");
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
    const { page, context, section } = await visitSection(site, "simple");
    await chooseVersion(page, "simple", "Vanilla");
    await chooseProvider(page, "simple", "MapLibre");
    expect(await mapLibreVersionIn(section, "vanilla").isVisible()).toBe(true);
    expect(await providerVersionIn(section, "google", "vanilla").isHidden()).toBe(true);
    await context.close();
  }, 30_000);

  it("shows MapLibre's files in the code tabs, with no Google loader", async () => {
    const { page, context } = await visitSection(site, "simple");
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
    const { page, context, section } = await visitSection(site, "route");
    expect(await section.getByRole("radio", { name: "MapLibre" }).isDisabled()).toBe(true);
    const group = section.getByRole("group", { name: "Run on" });
    const reason = page.locator(`#${await group.getAttribute("aria-describedby")}`);
    expect(await reason.textContent()).toBe("MapLibre has no routing.");
    expect(await reason.isVisible()).toBe(true);
    await context.close();
  }, 30_000);

  it("asks OpenFreeMap nothing before consent, a MapLibre version chosen", async () => {
    const { page, context, mapProviders, fetched } = await visitSection(site, "big");
    await chooseProvider(page, "big", "MapLibre");
    await chooseVersion(page, "big", "React");
    await page.waitForTimeout(SETTLE_MS);
    expect(mapProviders()).toEqual([]);
    expect(fetched("/points-4k.json")).toBe(false);
    await context.close();
  }, 30_000);

  it("leaves a running MapLibre version alone when Google's Maps JS fails", async () => {
    const { page, context, mapsJsRequests, section } = await visitSection(site, "simple");
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
    const reason = await page.getByText("MapLibre has no routing.").boundingBox();
    expect((reason?.x ?? 0) + (reason?.width ?? Number.POSITIVE_INFINITY)).toBeLessThanOrEqual(375);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );
    await context.close();
  }, 30_000);
});

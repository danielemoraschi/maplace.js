import type { Locator } from "playwright";
import { describe, expect, it } from "vitest";
import { chooseProvider, chooseVersion, visitSection } from "./home-sections.ts";
import { siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { opened } from "./site-session.ts";
import { DESKTOP } from "./visitor.ts";

const site = siteOnMapLibreBeforeTests();

/** The home page's panel corner (`--radius-panel`), which an example's map and code take. */
const PANEL = "22px";

const cornerOf = (element: Locator) =>
  element.evaluate((node) => getComputedStyle(node).borderRadius);
/**
 * The corners `frame.css` gives a version's map and its page's own buttons, read on probes put in
 * the version (`[map, button]`): a page's map draws only once it is in view.
 */
/** The corners of the stand-in a map shows until the maps load, and of its Load maps button. */
const placeholderCornersIn = (within: Locator) =>
  within
    .locator("[data-maps-grant]")
    .first()
    .evaluate((grant) =>
      [grant.parentElement as Element, grant].map((node) => getComputedStyle(node).borderRadius),
    );

const framedCornersIn = (within: Locator) =>
  within
    .locator(".version")
    .first()
    .evaluate((version) => {
      const probes = [document.createElement("div"), document.createElement("button")];
      probes[0]?.classList.add("maplace-maplibre-map");
      version.append(...probes);
      const corners = probes.map((probe) => getComputedStyle(probe).borderRadius);
      for (const probe of probes) probe.remove();
      return corners;
    });

describe("the corners of an example's map and code (W66)", () => {
  it("rounds an example's map, its own buttons, its code block, and a folded Google host as one block", async () => {
    const { page, context, section } = await visitSection(site, "simple");
    expect(await framedCornersIn(section)).toEqual([PANEL, "12px"]);
    expect(await placeholderCornersIn(section)).toEqual([PANEL, "12px"]);
    const code = section.locator('[role="tabpanel"] pre.astro-code').filter({ visible: true });
    expect(await cornerOf(code.first())).toBe(PANEL);
    await chooseVersion(page, "simple", "Bundler");
    await chooseProvider(page, "Google");
    const host = section.locator(".folded-host").filter({ visible: true });
    expect(await cornerOf(host)).toBe(PANEL);
    const parts = await host
      .locator("pre")
      .evaluateAll((pres) =>
        pres.map((pre) => [getComputedStyle(pre).borderRadius, getComputedStyle(pre).paddingTop]),
      );
    expect(new Set(parts.map(String))).toEqual(new Set(["0px,0px"]));
    await context.close();
  }, 30_000);

  it("keeps the snippet builder's preview map and buttons square", async () => {
    const { page, context } = await opened(site, "/builder/", DESKTOP);
    expect(await framedCornersIn(page.locator("main"))).toEqual(["0px", "0px"]);
    expect(await placeholderCornersIn(page.locator("main"))).toEqual(["0px", "0px"]);
    await context.close();
  }, 30_000);
});

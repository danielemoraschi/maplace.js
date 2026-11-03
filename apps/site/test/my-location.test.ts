import { describe, expect, it } from "vitest";
import { ORIGIN_DOT_CLASS } from "../../../packages/maplace/src/adapter-kit/origin-dot.ts";
import { OPENFREEMAP_STYLES } from "../../../packages/maplace/src/testing/examples/openfreemap-styles.ts";
import { DISTANCE_CLASS } from "../../../packages/maplace/src/views/option-node.ts";
import { mapLibreVersionIn } from "./drawn-on-maplibre.ts";
import {
  chooseVersion,
  leaveOnlySection,
  pageMapState,
  sectionOf,
  sectionPage,
  versionChoice,
} from "./home-sections.ts";
import { ON_MAPLIBRE, SECTION_MS, siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { loadMapsButtons } from "./visitor.ts";

const site = siteOnMapLibreBeforeTests();

/** Oslo: north of every place in the example. */
const OSLO = { latitude: 59.91, longitude: 10.75 };

/** Counts each ask for the position, from before any of the page's own scripts run. */
function countAsks(): void {
  const { geolocation } = navigator;
  const ask = geolocation.getCurrentPosition.bind(geolocation);
  const counted = window as unknown as { asks: number };
  counted.asks = 0;
  geolocation.getCurrentPosition = (...args) => {
    counted.asks += 1;
    ask(...args);
  };
}

describe("the My location control on the built site", () => {
  it("asks only when pressed, then sorts the list, says how far, and draws the dot, on MapLibre", {
    timeout: SECTION_MS,
  }, async () => {
    const { context, page, offsite, errors } = await site.visitor();
    await context.grantPermissions(["geolocation"], { origin: new URL(site.url).origin });
    await context.setGeolocation(OSLO);
    await context.addInitScript(countAsks);
    const asks = () => page.evaluate(() => (window as unknown as { asks: number }).asks);

    await page.goto(new URL(`${sectionPage("nearest")}#nearest`, site.url).href);
    await leaveOnlySection(page, "nearest");
    const section = await sectionOf(page, "nearest");
    await chooseVersion(page, "nearest", versionChoice("html").label);
    await loadMapsButtons(section).click();
    const version = mapLibreVersionIn(section, "html");
    await expect.poll(() => pageMapState(version), ON_MAPLIBRE).toBe("ready");
    expect(await asks()).toBe(0);

    const button = version.getByRole("button", { name: "My location" });
    await button.click();
    await expect.poll(() => button.getAttribute("aria-pressed"), ON_MAPLIBRE).toBe("true");
    expect(await asks()).toBe(1);
    const options = version.getByRole("option");
    await expect.poll(() => options.first().textContent(), ON_MAPLIBRE).toContain("Leeds");
    expect(await version.locator(`.${DISTANCE_CLASS}`).count()).toBe(await options.count());
    expect(await version.locator(`.${ORIGIN_DOT_CLASS}`).count()).toBe(1);

    await button.click();
    await expect.poll(() => version.locator(`.${ORIGIN_DOT_CLASS}`).count()).toBe(0);
    expect(await version.locator(`.${DISTANCE_CLASS}`).count()).toBe(0);

    const otherwise = offsite().filter((url) => !url.startsWith(OPENFREEMAP_STYLES));
    expect(otherwise, "asked offsite but OpenFreeMap's styles").toEqual([]);
    expect(errors()).toEqual([]);
    await context.close();
  });
});

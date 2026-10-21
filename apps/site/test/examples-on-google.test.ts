import type { Page } from "playwright";
import { describe, it } from "vitest";
import { describeWithKey } from "../../../packages/maplace/src/google/testing/with-key.ts";
import { EXAMPLE_SECTIONS } from "../src/examples/example-sections.ts";
import { VERSION_LABELS } from "../src/examples/example-versions.ts";
import {
  googleRefused,
  markersDrawn,
  pageMapState,
  settledMarkers,
  tilesDrawn,
  versionIn,
} from "./drawn-on-google.ts";
import { ON_GOOGLE, SECTION_MS, siteOnGoogleBeforeTests } from "./google-session.ts";
import { addedByBootstrap, chooseVersion, sectionOf } from "./visitor.ts";

/** A version as the section's switch offers it. */
type VersionChoice = (typeof VERSION_LABELS)[number];

/** The versions the site runs from its own bundle, beside the page's. */
const LIVE_VERSIONS = VERSION_LABELS.filter(({ kind }) => kind !== "html");

/**
 * Each section with its versions in the order the test opens them: the first loads Maps JS for
 * the page, in turn the element's own tag or a vanilla or React version's bootstrap, and the
 * others find it there.
 */
const SECTIONS = EXAMPLE_SECTIONS.map(({ name }, index) => {
  const turn = index % VERSION_LABELS.length;
  const order = [...VERSION_LABELS.slice(turn), ...VERSION_LABELS.slice(0, turn)];
  return { name, order, loader: order[0] as VersionChoice };
});

/**
 * Takes every other example's section off the page: consent releases each map that comes near
 * the screen, and a neighbour's (about 190px away) would load too, billed and unchecked.
 */
function leaveOnlySection(page: Page, name: string): Promise<void> {
  return page.evaluate((own) => {
    for (const section of document.querySelectorAll("section:has(.map-frame)")) {
      if (section.id !== own) section.remove();
    }
  }, name);
}

// Every section's page, vanilla and React versions on real Google Maps, on the site as built and
// served, with its key: each drawing Google's tiles, unrefused, the page's map ready, nothing
// thrown, and the three drawing as many markers (they are the same map).
describeWithKey("the site's examples on Google Maps", (key) => {
  const site = siteOnGoogleBeforeTests(key);

  describe.concurrent("each section", () => {
    it.for(SECTIONS)(
      "draws $name on Google, its $loader.label version loading Maps JS",
      { timeout: SECTION_MS },
      async ({ name, order, loader }, { expect }) => {
        const { page, context, errors, mapsJsRequests } = await site.visitor();
        await page.goto(new URL(`/#${name}`, site.url).href);
        await leaveOnlySection(page, name);
        const section = await sectionOf(page, name);

        /** Waits for `kind`'s map to be drawn on Google, unrefused. */
        async function drawnOnGoogle({ kind, label }: VersionChoice): Promise<void> {
          const drawn = `${name}'s ${label} version`;
          const version = versionIn(section, kind);
          if (kind === "html") {
            await expect
              .poll(() => pageMapState(section), { ...ON_GOOGLE, message: `${drawn}: state` })
              .toBe("ready");
          }
          await expect
            .poll(() => tilesDrawn(version), { ...ON_GOOGLE, message: `${drawn}: tiles` })
            .toBeGreaterThan(0);
          expect(await googleRefused(version).count(), `${drawn}: refused`).toBe(0);
        }

        await chooseVersion(page, name, loader.label);
        await section.getByRole("button", { name: "Load Google Maps" }).click();
        for (const version of order) {
          await chooseVersion(page, name, version.label);
          await drawnOnGoogle(version);
        }
        // The page's markers, once settled, then each live version shown again until it draws as
        // many: a version's markers (a clusterer's, after Google's first idle) may come late.
        await chooseVersion(page, name, "HTML");
        const markers = await settledMarkers(versionIn(section, "html"));
        for (const { kind, label } of LIVE_VERSIONS) {
          await chooseVersion(page, name, label);
          await expect
            .poll(() => markersDrawn(versionIn(section, kind)), {
              ...ON_GOOGLE,
              message: `${name}'s ${label} version: markers`,
            })
            .toBe(markers);
        }
        expect(await section.locator("[data-map-failure]").isVisible()).toBe(false);
        expect(errors()).toEqual([]);
        expect(mapsJsRequests().map(addedByBootstrap), "Maps JS by a bootstrap").toEqual([
          loader.kind !== "html",
        ]);
        expect(await page.locator(".gm-style").count(), "maps drawn").toBe(VERSION_LABELS.length);
        await context.close();
      },
    );
  });
});

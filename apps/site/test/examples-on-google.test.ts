import { describe, it } from "vitest";
import { describeWithKey } from "../../../packages/maplace/src/google/testing/with-key.ts";
import { EXAMPLE_SECTIONS } from "../src/examples/example-sections.ts";
import { isModuleVersion, VERSION_LABELS } from "../src/examples/example-versions.ts";
import {
  googleRefused,
  googleView,
  markersDrawn,
  settledMarkers,
  tilesDrawn,
  versionIn,
} from "./drawn-on-google.ts";
import { expectNotedInTurn } from "./failure-note-checks.ts";
import { ON_GOOGLE, SECTION_MS, siteOnGoogleBeforeTests } from "./google-session.ts";
import {
  chooseVersion,
  leaveOnlySection,
  pageMapState,
  sectionOf,
  type VersionChoice,
  versionsInTurn,
  visitSection,
} from "./home-sections.ts";
import { expectLeftOpensAsShown, LEFT_WHILE_LOADING } from "./left-while-loading.ts";
import { addedByBootstrap, loadMapsButtons } from "./visitor.ts";

/** The versions the site runs from its own bundle, beside the page's. */
const LIVE_VERSIONS = VERSION_LABELS.filter(({ kind }) => kind !== "html");

/**
 * Each section with its versions in the order the test opens them: the first loads Maps JS for
 * the page, in turn the element's own tag, a script version's adapter's tag, or a vanilla or React
 * version's bootstrap, and the others find it there.
 */
const SECTIONS = EXAMPLE_SECTIONS.map(({ name }, index) => {
  const order = versionsInTurn(index);
  return { name, order, loader: order[0] };
});

// Every section's page, script, vanilla and React versions on real Google Maps, on the site as
// built and served, with its key: each drawing Google's tiles, unrefused, the page's map ready,
// nothing thrown, and the live versions drawing as many markers as the page (the same map).
describeWithKey("the site's examples on Google Maps", (key) => {
  const site = siteOnGoogleBeforeTests(key);

  describe.concurrent("each section", () => {
    it.for(SECTIONS)(
      "draws $name on Google, its $loader.label version loading Maps JS",
      { timeout: SECTION_MS },
      async ({ name, order, loader }, { expect }) => {
        const { page, context, errors, mapsJsRequests, section } = await visitSection(site, name);

        /** Waits for `kind`'s map to be drawn on Google, unrefused. */
        async function drawnOnGoogle({ kind, label }: VersionChoice): Promise<void> {
          const drawn = `${name}'s ${label} version`;
          const version = versionIn(section, kind);
          if (kind === "html") {
            await expect
              .poll(() => pageMapState(version), {
                ...ON_GOOGLE,
                message: `${drawn}: state`,
              })
              .toBe("ready");
          }
          await expect
            .poll(() => tilesDrawn(version), { ...ON_GOOGLE, message: `${drawn}: tiles` })
            .toBeGreaterThan(0);
          expect(await googleRefused(version).count(), `${drawn}: refused`).toBe(0);
        }

        await chooseVersion(page, name, loader.label);
        await loadMapsButtons(section).click();
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
        // The page's element and a script version's adapter add Maps JS's own tag; a module
        // version's HTML, Google's bootstrap.
        expect(mapsJsRequests().map(addedByBootstrap), "Maps JS by a bootstrap").toEqual([
          isModuleVersion(loader.kind),
        ]);
        expect(await page.locator(".gm-style").count(), "maps drawn").toBe(VERSION_LABELS.length);
        await context.close();
      },
    );
  });

  // W23, as on MapLibre: styled's Google map has its map-type control on every version, so the
  // frames match.
  describe("a version left while it loads, on Google", () => {
    it.for(LEFT_WHILE_LOADING)(
      "opens $name on the view it would have had",
      { timeout: 90_000 },
      async (leftAndShown, { expect }) => {
        const { page, context, section, errors } = await visitSection(site, "styled");
        await expectLeftOpensAsShown({ page, section, example: "styled" }, leftAndShown, {
          versionIn: (kind) => versionIn(section, kind),
          viewOf: googleView,
          timeout: ON_GOOGLE.timeout,
        });
        expect(errors()).toEqual([]);
        await context.close();
      },
    );
  });

  // W22: every live version says Google refused the key, as the page map does. Seen at an origin
  // the key can't allow, answered by routing, so no port is taken; Google draws no map.
  it("says Google refused the site's key for each live version", async () => {
    const seenAt = "https://key-refused.invalid";
    const { page, context } = await site.visitor({ seenAt });
    await page.goto(new URL("/#simple", seenAt).href);
    await leaveOnlySection(page, "simple");
    // The Script version first, before consent: the page map, hidden, never loads.
    await chooseVersion(page, "simple", "Script");
    const section = await sectionOf(page, "simple");
    await loadMapsButtons(section).click();
    const inTurn = { example: "simple", provider: "google", timeout: ON_GOOGLE.timeout } as const;
    await expectNotedInTurn(
      page,
      section,
      { ...inTurn, kinds: ["script", "vanilla", "react"] },
      { failed: "provider-auth-failed", note: "Google refused this site's key.", reload: false },
    );
    await context.close();
  }, 120_000);
});

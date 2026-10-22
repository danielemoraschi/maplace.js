import { type Browser, chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { builtCdnScript, CDN_SCRIPTS } from "./cdn-builds.ts";
import { type CdnScriptPage, openCdnScriptPage } from "./cdn-script-page.ts";

// The MapLibre CDN script as a reader's page loads it: from another origin, pinned to its
// integrity, with nothing else to fetch. It relies on WebGL in Playwright's Chromium, as the
// MapLibre browser tests do (maplibre/webgl.browser.test.ts).

/** A plain background, as the package's test style is: nothing for the map to fetch. */
const STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#e8eef4" } }],
};

const BODY = `<maplace-map style="width:600px;height:400px" map-style='${JSON.stringify(STYLE)}'>
  <maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>
  <maplace-location location-id="milan" lat="45.46" lng="9.19" title="Milan"></maplace-location>
</maplace-map>`;

const READY = { timeout: 30_000 };

let browser: Browser | undefined;
let opened: CdnScriptPage;

/** One page, its map ready, read by every test: they only look. */
beforeAll(async () => {
  const script = await builtCdnScript("maplibre");
  browser = await chromium.launch();
  opened = await openCdnScriptPage(browser, { file: CDN_SCRIPTS.maplibre, script, body: BODY });
  await opened.page.waitForFunction(
    () =>
      document.querySelector<Element & { loadState: string }>("maplace-map")?.loadState === "ready",
    undefined,
    READY,
  );
}, 120_000);

afterAll(async () => {
  await opened?.close();
  await browser?.close();
});

describe("the MapLibre CDN script", { timeout: 60_000 }, () => {
  it("opens <maplace-map> on MapLibre from the one script, fetching nothing else", async () => {
    const { page, offsite, logged } = opened;
    expect(await page.locator(".maplace-map-pane .maplibregl-canvas").count()).toBe(1);
    expect(offsite()).toEqual([]);
    expect(logged()).toEqual([]);
  });

  it("starts MapLibre's worker from the script itself, and the worker answers", async () => {
    const { workers } = opened;
    const made = await workers();
    expect(made.length).toBeGreaterThan(0);
    for (const worker of made) {
      expect(worker).toEqual({
        url: expect.stringMatching(/^blob:https:\/\/page\.maplace\.test\//),
        type: "module",
        answered: true,
        errors: [],
      });
    }
  });

  it("brings MapLibre's stylesheet: a marker is placed absolutely, and no warning says it is missing", async () => {
    const { page, logged } = opened;
    const position = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.className = "maplibregl-marker";
      document.querySelector(".maplibregl-map")?.append(probe);
      return getComputedStyle(probe).position;
    });
    expect(position).toBe("absolute");
    expect(logged().filter((text) => text.includes("stylesheet"))).toEqual([]);
  });
});

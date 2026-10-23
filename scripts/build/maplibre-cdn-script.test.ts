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
let script: Uint8Array;
let opened: CdnScriptPage;

/** Waits until the page's `<maplace-map>` has opened its map. */
async function untilReady({ page }: CdnScriptPage): Promise<void> {
  await page.waitForFunction(
    () =>
      document.querySelector<Element & { loadState: string }>("maplace-map")?.loadState === "ready",
    undefined,
    READY,
  );
}

/** One page, its map ready, read by every test: they only look. */
beforeAll(async () => {
  script = await builtCdnScript("maplibre");
  browser = await chromium.launch();
  opened = await openCdnScriptPage(browser, { file: CDN_SCRIPTS.maplibre, script, body: BODY });
  await untilReady(opened);
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

describe("the MapLibre CDN script, clustering", { timeout: 60_000 }, () => {
  it("clusters a <maplace-map cluster> from the same script, fetching nothing else", async () => {
    const body = BODY.replace("<maplace-map ", "<maplace-map cluster ").replace(
      "</maplace-map>",
      '<maplace-location location-id="vatican" lat="41.903" lng="12.454" title="Vatican"></maplace-location></maplace-map>',
    );
    const clustered = await openCdnScriptPage(browser as Browser, {
      file: CDN_SCRIPTS.maplibre,
      script,
      body,
    });
    try {
      await untilReady(clustered);
      const { page, offsite, logged } = clustered;
      // Fitted to the three, Rome and the Vatican, 4 km apart, fall into one cluster.
      await page.getByRole("button", { name: "Cluster of 2 locations" }).waitFor(READY);
      expect(offsite()).toEqual([]);
      expect(logged()).toEqual([]);
    } finally {
      await clustered.close();
    }
  });
});

/** A page making its own MapLibre map with `Maplace.maplibre`, and drawing maplace's store on it. */
const OWN_MAP_BODY = `<div id="own" style="width:600px;height:400px"></div>
<script type="module">
  const map = new Maplace.maplibre.Map({ container: "own", style: ${JSON.stringify(STYLE)} });
  const maplace = Maplace.createMaplace({
    locations: [{ id: "rome", lat: 41.9, lng: 12.5, title: "Rome" }],
  });
  maplace.attach(Maplace.createMapLibreAdapter({ map }), "#own");
  maplace.whenReady().then(() => document.body.setAttribute("data-ready", ""));
</script>`;

describe("the MapLibre CDN script's own maplibre-gl", { timeout: 60_000 }, () => {
  it("makes a page's own map, with the script's worker and stylesheet, that maplace's store opens on", async () => {
    const own = await openCdnScriptPage(browser as Browser, {
      file: CDN_SCRIPTS.maplibre,
      script,
      body: OWN_MAP_BODY,
    });
    try {
      await own.page.locator("body[data-ready]").waitFor({ state: "attached", ...READY });
      expect(await own.page.locator("#own .maplibregl-canvas").count()).toBe(1);
      const made = await own.workers();
      expect(made.length).toBeGreaterThan(0);
      for (const worker of made) {
        expect(worker.url).toMatch(/^blob:https:\/\/page\.maplace\.test\//);
      }
      expect(own.offsite()).toEqual([]);
      expect(own.logged()).toEqual([]);
    } finally {
      await own.close();
    }
  });
});

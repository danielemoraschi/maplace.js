import type { MaplaceMapElement } from "@maplacejs/maplace/element";
import type { Locator, Page } from "playwright";
import { describe, expect, it } from "vitest";
import { BUILDER_PAGE } from "../src/site/footer-pages.ts";
import { mapLibreDrawn } from "./drawn-on-maplibre.ts";
import { pageMapState } from "./home-sections.ts";
import { ON_MAPLIBRE, siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { SETTLE_MS } from "./site-session.ts";
import { DESKTOP, type Visitor } from "./visitor.ts";
import { choosePreviewOnGoogle, writtenSnippetPage } from "./written-snippet.ts";

const site = siteOnMapLibreBeforeTests();

const POINTS =
  "{ lat: 45, lon: 9, title: 'A' }, { lat: 46, lon: 10, title: 'B' }, { lat: 45.5, lon: 11, title: 'C' }";
const STROKE = "stroke_options: { strokeColor: '#00f', fillColor: '#0f0', strokeWeight: 3 }";

async function snippetOf(text: string, visit: Visitor, google = false) {
  const { page } = visit;
  await page.goto(new URL(BUILDER_PAGE.route, site.url).href);
  await page.locator("[data-builder-status]").filter({ hasText: /./ }).waitFor();
  if (google) await choosePreviewOnGoogle(page);
  await page.locator("[data-builder-paste]").fill(text);
  await page.waitForTimeout(SETTLE_MS);
  return {
    text: (await page.locator("[data-builder-code]").textContent()) ?? "",
    status: await page.locator("[data-builder-status]").textContent(),
    asText: await page.locator("[data-builder-text-note]").isVisible(),
  };
}

const newVisitor = () => site.visitor({ viewport: DESKTOP });
const mapOn = (page: Page): Locator => page.locator("maplace-map");
const locationsOn = (page: Page) =>
  mapOn(page).evaluate(
    (map) =>
      JSON.parse(JSON.stringify((map as MaplaceMapElement).locations)) as Record<string, unknown>[],
  );

async function ready(page: Page): Promise<void> {
  await expect.poll(() => pageMapState(page.locator("body")), ON_MAPLIBRE).toBe("ready");
}

describe("a written snippet's popups", () => {
  it("stays whole around </template>, and falls back for <plaintext>", async () => {
    const visit = await newVisitor();
    const closing = await snippetOf(
      "[{ lat: 1, lng: 2, title: 'A', html: 'x</template><p>y</p>' }, { lat: 3, lng: 4, title: 'B' }]",
      visit,
    );
    const page = await writtenSnippetPage(visit, site.url, closing.text, "maplibre");
    expect(await page.locator("maplace-map > maplace-location").count()).toBe(2);
    await page.close();
    const swallowing = await snippetOf(
      "[{ lat: 1, lng: 2, title: 'A', html: '<plaintext>x' }, { lat: 3, lng: 4, title: 'B' }]",
      visit,
    );
    expect(swallowing.asText).toBe(true);
    expect(swallowing.text).not.toContain("<plaintext");
    await visit.context.close();
  }, 60_000);
});

describe("a written snippet's noscript", () => {
  it.each([
    [
      "a comment",
      "<noscript><!-- </noscript></template><script>window.ran=1</script> --></noscript>",
    ],
    [
      "a style",
      "<noscript><style></noscript></template><script>window.ran=1</script></style></noscript>",
    ],
  ])(
    "can't close its template from %s",
    async (_name, html) => {
      const visit = await newVisitor();
      const { text, asText } = await snippetOf(
        `[${JSON.stringify({ lat: 1, lng: 2, title: "A", html })}]`,
        visit,
      );
      expect(asText).toBe(true);
      const page = await writtenSnippetPage(visit, site.url, text, "maplibre");
      expect(await page.evaluate(() => "ran" in window)).toBe(false);
      await visit.context.close();
    },
    60_000,
  );
});

describe("a snippet runs as a page", () => {
  const GEOJSON = JSON.stringify({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "a",
        properties: { title: "A" },
        geometry: { type: "Point", coordinates: [9, 45] },
      },
      {
        type: "Feature",
        id: "b",
        properties: { name: "B" },
        geometry: { type: "Point", coordinates: [10, 46] },
      },
    ],
  });

  it.each([
    ["CSV", "title,lat,lng\nA,45,9\nB,46,10"],
    ["JSON", '[{ "title": "A", "lat": 45, "lng": 9 }, { "title": "B", "lat": 46, "lng": 10 }]'],
    ["GeoJSON", GEOJSON],
    [
      "a 0.2 config",
      "new Maplace({ controls_type: 'list', locations: [{ lat: 45, lon: 9, title: 'A' }, { lat: 46, lon: 10, title: 'B' }] }).Load();",
    ],
    [
      "a 0.2 config with html",
      "new Maplace({ controls_type: 'list', locations: [{ lat: 45, lon: 9, title: 'A', html: '<b>a</b>' }, { lat: 46, lon: 10, title: 'B' }] }).Load();",
    ],
  ])(
    "from %s, with its script's integrity checked",
    async (_name, pasted) => {
      const visit = await newVisitor();
      const { text } = await snippetOf(pasted, visit);
      const page = await writtenSnippetPage(visit, site.url, text, "maplibre");
      const failures: string[] = [];
      page.on("pageerror", (error) => failures.push(String(error)));
      await ready(page);
      const titles = (await locationsOn(page)).map(({ title }) => title);
      expect(titles).toEqual(["A", "B"]);
      expect(await page.getByText("A", { exact: true }).count()).toBeGreaterThan(0);
      expect(failures).toEqual([]);
      await visit.context.close();
    },
    60_000,
  );

  it("from a plain 0.2 config: a select on the map, its start selected", async () => {
    const visit = await newVisitor();
    const { text } = await snippetOf(
      `new Maplace({ start: 2, locations: [${POINTS}] }).Load();`,
      visit,
    );
    expect(text).toContain('list="select"');
    const page = await writtenSnippetPage(visit, site.url, text, "maplibre");
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(String(error)));
    await ready(page);
    expect(await page.locator("maplace-map select").count()).toBe(1);
    await expect
      .poll(() =>
        mapOn(page).evaluate((map) => (map as MaplaceMapElement).maplace.getSnapshot().selectedId),
      )
      .toBe("2");
    expect(failures).toEqual([]);
    await visit.context.close();
  }, 60_000);

  it.each([
    ["polyline", { stroke: "#00f", strokeWidth: 3 }],
    ["polygon", { stroke: "#00f", strokeWidth: 3, fill: "#0f0" }],
  ])(
    "a 0.2 %s's snippet runs as that shape, with its points",
    async (type, style) => {
      const visit = await newVisitor();
      const { text } = await snippetOf(
        `{ type: '${type}', ${STROKE}, locations: [${POINTS}] }`,
        visit,
      );
      expect(text).toContain("application/json");
      const page = await writtenSnippetPage(visit, site.url, text, "maplibre");
      await ready(page);
      expect(await mapLibreDrawn(page.locator("body"))).toBe(true);
      const locations = await locationsOn(page);
      expect(locations).toHaveLength(4);
      expect(locations[3]).toMatchObject({
        type,
        listed: false,
        style,
        path: [
          { lat: 45, lng: 9 },
          { lat: 46, lng: 10 },
          { lat: 45.5, lng: 11 },
        ],
      });
      await visit.context.close();
    },
    60_000,
  );

  it.each([
    ["without html, as JSON", "", "application/json"],
    ["with html, as children", ", html: '<b>h</b>'", 'type="circle"'],
  ])(
    "a 0.2 circle's snippet runs %s",
    async (_name, popup, form) => {
      const visit = await newVisitor();
      const { text } = await snippetOf(
        `{ type: 'circle', ${STROKE}, circle_options: { radius: 800 }, locations: [{ lat: 45, lon: 9, title: 'A'${popup} }, { lat: 46, lon: 10, title: 'B' }] }`,
        visit,
      );
      expect(text).toContain(form);
      const page = await writtenSnippetPage(visit, site.url, text, "maplibre");
      await ready(page);
      const [first] = await locationsOn(page);
      expect(first).toMatchObject({
        type: "circle",
        center: { lat: 45, lng: 9 },
        radius: 800,
        style: { stroke: "#00f", strokeWidth: 3, fill: "#0f0" },
      });
      await visit.context.close();
    },
    60_000,
  );

  it("a Google snippet parses as a page with its locations, Google refused", async () => {
    const visit = await newVisitor();
    const { text } = await snippetOf("title,lat,lng\nA,45,9\nB,46,10", visit, true);
    expect(text).toContain('api-key="YOUR_KEY"');
    const page = await writtenSnippetPage(visit, site.url, text, "plain");
    await expect
      .poll(() =>
        mapOn(page).evaluate((map) =>
          (map as MaplaceMapElement).locations?.map(({ title }) => title),
        ),
      )
      .toEqual(["A", "B"]);
    await visit.context.close();
  }, 60_000);
});

import { describe, expect, it } from "vitest";
import { livePage } from "./live-page.ts";
import { INERT_SCRIPT_TYPE } from "./page-scripts.ts";

const PAGE = `<!doctype html>
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<maplace-map api-key="YOUR_KEY" map-id="DEMO_MAP_ID">
  <maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>
</maplace-map>`;

describe("livePage", () => {
  it("is the page's map, held, with the site's key, without the doctype or the CDN script", () => {
    expect(
      livePage(PAGE, { apiKey: "site-key" }),
    ).toBe(`<maplace-map hold api-key="site-key" map-id="DEMO_MAP_ID">
  <maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>
</maplace-map>`);
  });

  it("leaves the key out when the site has none, so the map says so once asked", () => {
    expect(livePage(PAGE, { apiKey: undefined })).toMatch(
      /^<maplace-map hold map-id="DEMO_MAP_ID">/,
    );
  });

  it("gives a map without a map ID the site's, written as an attribute value", () => {
    const page = PAGE.replace(' map-id="DEMO_MAP_ID"', "");
    expect(livePage(page, { mapId: 'm"1' })).toMatch(/^<maplace-map hold map-id="m&quot;1">/);
  });

  it("keeps a page's own map ID", () => {
    expect(livePage(PAGE, { mapId: "site-map" })).toMatch(
      /^<maplace-map hold map-id="DEMO_MAP_ID">/,
    );
  });

  it("looks for a map ID in the map's own tag only", () => {
    const page = PAGE.replace(' map-id="DEMO_MAP_ID"', "").replace(
      'title="Rome"',
      'title="its map-id=here"',
    );
    expect(livePage(page, { mapId: "site-map" })).toMatch(/^<maplace-map hold map-id="site-map">/);
  });

  it("reads the map's own tag past a > inside an attribute's value", () => {
    const page = PAGE.replace("<maplace-map", '<maplace-map title="a>b"');
    expect(livePage(page, { mapId: "site-map" })).not.toContain('map-id="site-map"');
  });

  it("writes the key as an attribute value, whatever it holds", () => {
    expect(livePage(PAGE, { apiKey: 'a"b<c&' })).toContain('api-key="a&quot;b&lt;c&amp;"');
  });

  it("keeps the page's other nodes and scripts in order, its scripts inert until the map opens", () => {
    const page = `${PAGE}
<aside id="details"></aside>
<script>
  document.getElementById('details').textContent = 'x';
</script>
<script type="module">
  await fetch('/locations.json');
</script>`;
    const live = livePage(page, { apiKey: "k" });
    expect(live).toContain('<aside id="details"></aside>');
    expect(live).toContain(`<script type="${INERT_SCRIPT_TYPE}">
  document.getElementById('details')`);
    expect(live).toContain(`<script type="${INERT_SCRIPT_TYPE}" data-type="module">
  await fetch`);
    expect(live).not.toMatch(/<script>|<script type="module">/);
  });

  it("keeps a page's own styles", () => {
    const page = PAGE.replace("<maplace-map", "<style>#m { color: red; }</style>\n<maplace-map");
    expect(livePage(page, { apiKey: "k" })).toContain("<style>#m { color: red; }</style>");
  });

  it("leaves the data inside the map as it is", () => {
    const page = PAGE.replace(
      "<maplace-location",
      '<script type="application/json">[]</script>\n  <maplace-location',
    );
    expect(livePage(page, { apiKey: "k" })).toContain(
      '<script type="application/json">[]</script>',
    );
  });

  it("refuses a page that doesn't load the CDN script once, or loads another script", () => {
    const withoutCdn = PAGE.replace(/<script src[^\n]+\n/, "");
    expect(() => livePage(withoutCdn, { apiKey: "k" })).toThrow(/CDN script/);
    expect(() => livePage(`${PAGE}<script src="/other.js"></script>`, { apiKey: "k" })).toThrow(
      /script/,
    );
  });

  it("refuses a page without exactly one map", () => {
    expect(() => livePage("<p></p>", { apiKey: "k" })).toThrow(/one <maplace-map>/);
    expect(() => livePage(`${PAGE}${PAGE}`, { apiKey: "k" })).toThrow(/one <maplace-map>/);
  });

  it("refuses a map without the placeholder key, where the site's would go", () => {
    expect(() => livePage('<maplace-map map-id="x"></maplace-map>', { apiKey: "k" })).toThrow(
      /YOUR_KEY/,
    );
  });
});

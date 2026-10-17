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
      livePage(PAGE, "site-key"),
    ).toBe(`<maplace-map hold api-key="site-key" map-id="DEMO_MAP_ID">
  <maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>
</maplace-map>`);
  });

  it("leaves the key out when the site has none, so the map says so once asked", () => {
    expect(livePage(PAGE, undefined)).toMatch(/^<maplace-map hold map-id="DEMO_MAP_ID">/);
  });

  it("writes the key as an attribute value, whatever it holds", () => {
    expect(livePage(PAGE, 'a"b<c&')).toContain('api-key="a&quot;b&lt;c&amp;"');
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
    const live = livePage(page, "k");
    expect(live).toContain('<aside id="details"></aside>');
    expect(live).toContain(`<script type="${INERT_SCRIPT_TYPE}">
  document.getElementById('details')`);
    expect(live).toContain(`<script type="${INERT_SCRIPT_TYPE}" data-type="module">
  await fetch`);
    expect(live).not.toMatch(/<script>|<script type="module">/);
  });

  it("leaves the data inside the map as it is", () => {
    const page = PAGE.replace(
      "<maplace-location",
      '<script type="application/json">[]</script>\n  <maplace-location',
    );
    expect(livePage(page, "k")).toContain('<script type="application/json">[]</script>');
  });

  it("refuses a page that doesn't load the CDN script once, or loads another script", () => {
    const withoutCdn = PAGE.replace(/<script src[^\n]+\n/, "");
    expect(() => livePage(withoutCdn, "k")).toThrow(/CDN script/);
    expect(() => livePage(`${PAGE}<script src="/other.js"></script>`, "k")).toThrow(/script/);
  });

  it("refuses a page without exactly one map", () => {
    expect(() => livePage("<p></p>", "k")).toThrow(/one <maplace-map>/);
    expect(() => livePage(`${PAGE}${PAGE}`, "k")).toThrow(/one <maplace-map>/);
  });

  it("refuses a map without the placeholder key, where the site's would go", () => {
    expect(() => livePage('<maplace-map map-id="x"></maplace-map>', "k")).toThrow(/YOUR_KEY/);
  });
});

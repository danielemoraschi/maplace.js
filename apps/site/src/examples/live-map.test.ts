import { describe, expect, it } from "vitest";
import { liveMap } from "./live-map.ts";

const PAGE = `<!doctype html>
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<maplace-map api-key="YOUR_KEY" map-id="DEMO_MAP_ID">
  <maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>
</maplace-map>`;

describe("liveMap", () => {
  it("is the page's map, held, with the site's key, without the page's script", () => {
    expect(
      liveMap(PAGE, "site-key"),
    ).toBe(`<maplace-map hold api-key="site-key" map-id="DEMO_MAP_ID">
  <maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>
</maplace-map>`);
  });

  it("leaves the key out when the site has none, so the map says so once asked", () => {
    expect(liveMap(PAGE, undefined)).toMatch(/^<maplace-map hold map-id="DEMO_MAP_ID">/);
  });

  it("writes the key as an attribute value, whatever it holds", () => {
    expect(liveMap(PAGE, 'a"b<c&')).toContain('api-key="a&quot;b&lt;c&amp;"');
  });

  it("refuses a page without exactly one map", () => {
    expect(() => liveMap("<p></p>", "k")).toThrow(/one <maplace-map>/);
    expect(() => liveMap(`${PAGE}${PAGE}`, "k")).toThrow(/one <maplace-map>/);
  });

  it("refuses a map without the placeholder key, where the site's would go", () => {
    expect(() => liveMap('<maplace-map map-id="x"></maplace-map>', "k")).toThrow(/YOUR_KEY/);
  });
});

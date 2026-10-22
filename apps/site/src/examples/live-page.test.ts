import { describe, expect, it } from "vitest";
import { livePage } from "./live-page.ts";
import { INERT_SCRIPT_TYPE } from "./page-scripts.ts";

const PAGE = `<!doctype html>
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<maplace-map api-key="YOUR_KEY">
  <maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>
</maplace-map>`;

/** A provider's `holdMap` as a test sees it: the map marked, to find where it went. */
const marked = (map: string) => `[held]${map}`;

describe("livePage", () => {
  it("puts the held map where the page's was, without the doctype or the CDN script", () => {
    expect(livePage(PAGE, marked)).toBe(`[held]<maplace-map api-key="YOUR_KEY">
  <maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>
</maplace-map>`);
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
    const live = livePage(page, marked);
    expect(live).toContain('<aside id="details"></aside>');
    expect(live).toContain(`<script type="${INERT_SCRIPT_TYPE}">
  document.getElementById('details')`);
    expect(live).toContain(`<script type="${INERT_SCRIPT_TYPE}" data-type="module">
  await fetch`);
    expect(live).not.toMatch(/<script>|<script type="module">/);
  });

  it("keeps a page's own styles", () => {
    const page = PAGE.replace("<maplace-map", "<style>#m { color: red; }</style>\n<maplace-map");
    expect(livePage(page, marked)).toContain("<style>#m { color: red; }</style>");
  });

  it("leaves the data inside the map as it is", () => {
    const page = PAGE.replace(
      "<maplace-location",
      '<script type="application/json">[]</script>\n  <maplace-location',
    );
    expect(livePage(page, marked)).toContain('<script type="application/json">[]</script>');
  });

  it("drops MapLibre's CDN script as Google's", () => {
    const page = PAGE.replace("maplace-element.iife.js", "maplace-element-maplibre.iife.js");
    expect(livePage(page, marked)).toMatch(/^\[held\]<maplace-map/);
  });

  it("refuses a page that doesn't load the CDN script once, or loads another script", () => {
    const withoutCdn = PAGE.replace(/<script src[^\n]+\n/, "");
    expect(() => livePage(withoutCdn, marked)).toThrow(/CDN script/);
    expect(() => livePage(`${PAGE}<script src="/other.js"></script>`, marked)).toThrow(/script/);
  });

  it("refuses a page without exactly one map", () => {
    expect(() => livePage("<p></p>", marked)).toThrow(/one <maplace-map>/);
    expect(() => livePage(`${PAGE}${PAGE}`, marked)).toThrow(/one <maplace-map>/);
  });
});

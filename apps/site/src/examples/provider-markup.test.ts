import { describe, expect, it } from "vitest";
import { EXAMPLE_SECTIONS } from "./example-sections.ts";
import { liveVersions } from "./live-versions.ts";
import { PROVIDER_MARKUP } from "./provider-markup.ts";

const GOOGLE_MAP = `<maplace-map api-key="YOUR_KEY" map-id="DEMO_MAP_ID">
  <maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>
</maplace-map>`;

const MAPLIBRE_MAP = `<maplace-map>
  <maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>
</maplace-map>`;

const BOOTSTRAP_HOST = `<script>
  (g=>{/* Google's loader */})({ key: "YOUR_KEY", v: "weekly" });
</script>
<div id="m"></div>`;

const google = PROVIDER_MARKUP.google;
const maplibre = PROVIDER_MARKUP.maplibre({ apiKey: "site-key", mapId: "site-map" });

describe("Google's markup", () => {
  it("holds the map under its provider, with the site's key", () => {
    expect(google({ apiKey: "site-key" }).holdMap(GOOGLE_MAP)).toBe(
      GOOGLE_MAP.replace(
        '<maplace-map api-key="YOUR_KEY"',
        '<maplace-map hold provider="google" api-key="site-key"',
      ),
    );
  });

  it("leaves the key out when the site has none, so the map says so once asked", () => {
    expect(google({}).holdMap(GOOGLE_MAP)).toMatch(
      /^<maplace-map hold provider="google" map-id="DEMO_MAP_ID">/,
    );
  });

  it("gives a map without a map ID the site's, written as an attribute value", () => {
    const map = GOOGLE_MAP.replace(' map-id="DEMO_MAP_ID"', "");
    expect(google({ mapId: 'm"1' }).holdMap(map)).toMatch(
      /^<maplace-map hold provider="google" map-id="m&quot;1">/,
    );
  });

  it("keeps a page's own map ID, looking in the map's own tag only", () => {
    expect(google({ mapId: "site-map" }).holdMap(GOOGLE_MAP)).not.toContain("site-map");
    const map = GOOGLE_MAP.replace(' map-id="DEMO_MAP_ID"', "").replace(
      'title="Rome"',
      'title="its map-id=here"',
    );
    expect(google({ mapId: "site-map" }).holdMap(map)).toContain('map-id="site-map"');
  });

  it("reads the map's own tag past a > inside an attribute's value", () => {
    const map = GOOGLE_MAP.replace(' map-id="DEMO_MAP_ID"', ' title="a>b" map-id="own"');
    expect(google({ mapId: "site-map" }).holdMap(map)).not.toContain('map-id="site-map"');
  });

  it("writes the key as an attribute value, whatever it holds", () => {
    expect(google({ apiKey: 'a"b<c&' }).holdMap(GOOGLE_MAP)).toContain(
      'api-key="a&quot;b&lt;c&amp;"',
    );
  });

  it("refuses a map without the placeholder key, where the site's would go", () => {
    expect(() => google({ apiKey: "k" }).holdMap('<maplace-map map-id="x"></maplace-map>')).toThrow(
      /YOUR_KEY/,
    );
  });

  it("gives a host's bootstrap the site's key, as a script's string", () => {
    expect(google({ apiKey: "site-key" }).prepareHost(BOOTSTRAP_HOST)).toContain('key: "site-key"');
    expect(google({ apiKey: 'a"b</script>' }).prepareHost(BOOTSTRAP_HOST)).toContain(
      'key: "a\\"b\\x3c/script>"',
    );
  });

  it("keeps the bootstrap's placeholder when the site has no key: the frame says so", () => {
    expect(google({}).prepareHost(BOOTSTRAP_HOST)).toBe(BOOTSTRAP_HOST);
  });

  it("refuses a host without the placeholder key once", () => {
    expect(() => google({ apiKey: "k" }).prepareHost("<div></div>")).toThrow(/YOUR_KEY/);
  });
});

describe("MapLibre's markup", () => {
  it("holds a MapLibre page's map under its provider, with no key or map ID", () => {
    expect(maplibre.holdMap(MAPLIBRE_MAP)).toBe(
      MAPLIBRE_MAP.replace("<maplace-map>", '<maplace-map hold provider="maplibre">'),
    );
  });

  it("leaves a MapLibre host as written", () => {
    const host = '<div id="m"></div>\n<script type="module" src="./vanilla.ts"></script>';
    expect(maplibre.prepareHost(host)).toBe(host);
  });
});

describe("every page map on the site", () => {
  it("names the provider, so two providers can share the page", () => {
    const pages = EXAMPLE_SECTIONS.flatMap(({ name }) =>
      liveVersions(name, { apiKey: "k" }).filter(({ kind }) => kind === "html"),
    );
    for (const { provider, markup } of pages) {
      expect(markup).toContain(`<maplace-map hold provider="${provider}"`);
    }
    expect(new Set(pages.map(({ provider }) => provider))).toEqual(new Set(["google", "maplibre"]));
  });
});

describe("each provider's script versions", () => {
  const SCRIPT = `<script type="module">
  Maplace.createGoogleMap("#m", { apiKey: "YOUR_KEY", locations: [] });
</script>`;

  it("gives a Google script version the site's key, a JS string that can't end its script", () => {
    expect(google({ apiKey: "k</script>" }).prepareScript(SCRIPT)).toContain(
      String.raw`apiKey: "k\x3c/script>"`,
    );
  });

  it("keeps the placeholder when the site has no key: the frame says so, and runs nothing", () => {
    expect(google({}).prepareScript(SCRIPT)).toBe(SCRIPT);
  });

  it('refuses a Google script version without apiKey: "YOUR_KEY" once', () => {
    expect(() => google({}).prepareScript(SCRIPT.replace("YOUR_KEY", "mine"))).toThrow(
      /apiKey: "YOUR_KEY"/,
    );
  });

  it("leaves a MapLibre script version as it is", () => {
    expect(maplibre.prepareScript(SCRIPT)).toBe(SCRIPT);
  });
});

import { describe, expect, it } from "vitest";
import { mapsScriptUrl } from "../../../../packages/maplace/src/google/maps-script-url.ts";
import {
  GOOGLE_MAPS,
  goesToMapProvider,
  MAP_PROVIDER_NAMES,
  OPENFREEMAP,
  thirdPartyOf,
} from "./third-parties.ts";

describe("thirdPartyOf", () => {
  it("Google Maps receives Maps JS and what it fetches", () => {
    const requests = [
      mapsScriptUrl({ apiKey: "k" }),
      "https://maps.gstatic.com/tile.png",
      "https://fonts.gstatic.com/s/roboto.woff2",
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      "https://www.google.com/maps/vt",
      "https://geo0.ggpht.com/cbk?panoid=x",
      "https://lh3.googleusercontent.com/p/x",
    ];
    expect(requests.map(thirdPartyOf)).toEqual(requests.map(() => GOOGLE_MAPS));
  });

  it("OpenFreeMap receives MapLibre's default style and what it fetches", () => {
    const requests = [
      "https://tiles.openfreemap.org/styles/liberty",
      "https://tiles.openfreemap.org/planet",
      "https://tiles.openfreemap.org/natural_earth/ne2sr/3/4/2.png",
      "https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/0-255.pbf",
      "https://tiles.openfreemap.org/sprites/ofm_f384/ofm.json",
    ];
    expect(requests.map(thirdPartyOf)).toEqual(requests.map(() => OPENFREEMAP));
  });

  it("names no third party for GitHub, which the pages no longer contact (W44)", () => {
    expect(thirdPartyOf("https://api.github.com/repos/danielemoraschi/maplace.js")).toBeUndefined();
  });

  it("no one receives the site's own requests or a lookalike host", () => {
    const requests = [
      "http://127.0.0.1:4390/privacy/",
      "https://google.com.example.org/x",
      "https://notgoogle.com/x",
      "https://tiles.openfreemap.org.example.org/x",
      "https://openfreemap.org/privacy/",
    ];
    expect(requests.map(thirdPartyOf)).toEqual(requests.map(() => undefined));
  });
});

describe("the maps' consent", () => {
  const mapsScript = mapsScriptUrl({ apiKey: "k" });
  const openFreeMapTile = "https://tiles.openfreemap.org/planet";
  const githubApi = "https://api.github.com/repos/x/y";

  it("names Google Maps and OpenFreeMap as the placeholder shows them", () => {
    expect(MAP_PROVIDER_NAMES).toBe("Google Maps and OpenFreeMap");
  });

  it("says which requests go to a map provider", () => {
    expect([mapsScript, openFreeMapTile].map(goesToMapProvider)).toEqual([true, true]);
    expect([githubApi, "http://127.0.0.1:4390/"].map(goesToMapProvider)).toEqual([false, false]);
  });
});

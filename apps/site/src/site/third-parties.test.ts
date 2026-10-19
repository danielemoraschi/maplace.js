import { describe, expect, it } from "vitest";
import { mapsScriptUrl } from "../../../../packages/maplace/src/google/maps-script-url.ts";
import { GOOGLE_MAPS, thirdPartyOf } from "./third-parties.ts";

describe("thirdPartyOf", () => {
  it("Google Maps receives Maps JS and what it fetches", () => {
    const requests = [
      mapsScriptUrl({ key: "k" }),
      "https://maps.gstatic.com/tile.png",
      "https://fonts.gstatic.com/s/roboto.woff2",
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      "https://www.google.com/maps/vt",
      "https://geo0.ggpht.com/cbk?panoid=x",
      "https://lh3.googleusercontent.com/p/x",
    ];
    expect(requests.map(thirdPartyOf)).toEqual(requests.map(() => GOOGLE_MAPS));
  });

  it("no one receives the site's own requests or a lookalike host", () => {
    const requests = [
      "http://127.0.0.1:4390/privacy/",
      "https://google.com.example.org/x",
      "https://notgoogle.com/x",
    ];
    expect(requests.map(thirdPartyOf)).toEqual(requests.map(() => undefined));
  });
});

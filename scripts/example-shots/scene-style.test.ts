import { describe, expect, it } from "vitest";
import { PLACED_LIST_CLASS } from "../../packages/maplace/src/element/default-styles.ts";
import { MAPLIBRE_MAP_CLASS } from "../../packages/maplace/src/maplibre/control-styles.ts";
import { GLOBE_CLASS } from "../../packages/maplace/src/maplibre/globe.ts";
import { finishingStyle, sceneStyle } from "./scene-style.ts";
import { SHARING, THUMBNAIL } from "./shot-sizes.ts";

const CREDIT = ".maplibregl-ctrl-attrib";
// The package's own classes, which `scene-style.ts` can only write out (plain Node can't load
// their modules): a renamed one fails here, not silently in the next capture.
const LIST = `.${PLACED_LIST_CLASS}`;
const EXAMPLE = 'section#route [data-live-version="html"][data-provider="maplibre"]';

describe("finishingStyle", () => {
  it("hides the map's credit line in a thumbnail, whose page credits it, and keeps it in a sharing image", () => {
    expect(finishingStyle(THUMBNAIL)).toContain(CREDIT);
    expect(finishingStyle(SHARING)).not.toContain(CREDIT);
  });

  it("hides the map's zoom buttons and globe toggle in every picture", () => {
    for (const size of [THUMBNAIL, SHARING]) {
      expect(finishingStyle(size)).toContain(".maplibregl-ctrl-zoom-in");
      expect(finishingStyle(size)).toContain(`.${GLOBE_CLASS}`);
    }
  });
});

describe("sceneStyle", () => {
  it("pins the example's map, or the whole example when its plan frames it", () => {
    expect(sceneStyle({ name: "route" })).toContain(`${EXAMPLE} maplace-map {`);
    expect(sceneStyle({ name: "route", frame: "example" })).toContain(`${EXAMPLE} {`);
    expect(sceneStyle({ name: "route", frame: "example" })).not.toContain(
      `${EXAMPLE} maplace-map {`,
    );
  });

  it("takes away the site's border round the map", () => {
    expect(sceneStyle({ name: "route" })).toContain(`.${MAPLIBRE_MAP_CLASS} { border: 0`);
  });

  it("hides the map's own list only when its plan says so", () => {
    expect(sceneStyle({ name: "route" })).not.toContain(LIST);
    expect(sceneStyle({ name: "route", hidesList: true })).toContain(LIST);
  });
});

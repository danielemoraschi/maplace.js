import type { Locator } from "playwright";
import { GOOGLE_MAP_CLASS } from "../../../packages/maplace/src/google/control-styles.ts";
import type { VersionKind } from "../src/examples/example-versions.ts";
import { ON_GOOGLE } from "./google-session.ts";
import { providerVersionIn } from "./home-sections.ts";
import { settled } from "./site-session.ts";

/** `kind`'s version on Google of the example in `section`. */
export function versionIn(section: Locator, kind: VersionKind): Locator {
  return providerVersionIn(section, "google", kind);
}

/**
 * The map tiles Google drew in `version`: images, on the raster maps the site runs (Google's demo
 * map ID among them); none while Google refuses the key.
 */
export function tilesDrawn(version: Locator): Promise<number> {
  return version
    .locator(".gm-style img")
    .evaluateAll(
      (images: HTMLImageElement[]) =>
        images.filter((image) => image.complete && image.naturalWidth > 0).length,
    );
}

/** The markers Google shows in `version`: its locations' and its clusters'. */
export function markersDrawn(version: Locator): Promise<number> {
  return version.locator("gmp-advanced-marker").count();
}

/**
 * `version`'s markers once their count holds over `SETTLE_MS` (a clusterer draws its clusters
 * after the map is ready); throws if it hasn't within `ON_GOOGLE`'s timeout.
 */
export function settledMarkers(version: Locator): Promise<number> {
  return settled(() => markersDrawn(version), { timeout: ON_GOOGLE.timeout, what: "the markers" });
}

/** Google's own note that the map can't load: its key refused. */
export function googleRefused(version: Locator): Locator {
  return version.locator(".gm-err-container");
}

/**
 * Google's view in `version`: every marker's offset from its map's centre, in whole CSS pixels,
 * sorted; `undefined` until the map and each of its markers have a size. With several locations
 * it moves with the view: a fit on a sizeless box, or the world's view, spreads them otherwise.
 */
export function googleView(version: Locator): Promise<string | undefined> {
  return version.evaluate((element, mapClass) => {
    const sized = (box: DOMRect) => box.width > 0 && box.height > 0;
    const centreOf = (box: DOMRect) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
    const map = element.querySelector(`.${mapClass}`)?.getBoundingClientRect();
    const markers = [...element.querySelectorAll("gmp-advanced-marker")].map((marker) =>
      marker.getBoundingClientRect(),
    );
    if (map === undefined || !sized(map) || markers.length === 0 || !markers.every(sized)) {
      return undefined;
    }
    const centre = centreOf(map);
    const offsets = markers
      .map(centreOf)
      .map(({ x, y }) => ({ x: Math.round(x - centre.x), y: Math.round(y - centre.y) }))
      .sort((a, b) => a.x - b.x || a.y - b.y);
    return JSON.stringify(offsets);
  }, GOOGLE_MAP_CLASS);
}

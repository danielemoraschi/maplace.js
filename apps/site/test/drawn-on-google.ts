import { setTimeout as pause } from "node:timers/promises";
import type { Locator } from "playwright";
import type { VersionKind } from "../src/examples/example-versions.ts";
import { ON_GOOGLE } from "./google-session.ts";
import { providerVersionIn } from "./home-sections.ts";
import { SETTLE_MS } from "./site-session.ts";

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
export async function settledMarkers(version: Locator): Promise<number> {
  const giveUpAt = Date.now() + ON_GOOGLE.timeout;
  let count = await markersDrawn(version);
  while (Date.now() < giveUpAt) {
    await pause(SETTLE_MS);
    const next = await markersDrawn(version);
    if (next === count) return count;
    count = next;
  }
  throw new Error(`the markers kept changing for ${ON_GOOGLE.timeout} ms, last ${count}`);
}

/** Google's own note that the map can't load: its key refused. */
export function googleRefused(version: Locator): Locator {
  return version.locator(".gm-err-container");
}

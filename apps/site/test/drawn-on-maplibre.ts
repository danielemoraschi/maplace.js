import type { MaplaceMapElement } from "maplace/element";
import type { Locator, Page } from "playwright";
import type { VersionKind } from "../src/examples/example-versions.ts";
import { providerVersionIn } from "./home-sections.ts";

/**
 * What maplace warns of on a page that runs MapLibre without its stylesheet: the probe that
 * `missingStylesheetWarnings` matches, held to the package's own warning by
 * `missing-stylesheet-probe.test.ts`.
 */
export const MISSING_STYLESHEET = "MapLibre's stylesheet is missing";

/** `kind`'s version on MapLibre of the example in `section`. */
export function mapLibreVersionIn(section: Locator, kind: VersionKind): Locator {
  return providerVersionIn(section, "maplibre", kind);
}

/**
 * Records, from now on, each `loadState` the page map in `version` goes through, as the page sees
 * it frame by frame; gives back what it has seen so far.
 */
export async function recordLoadStates(version: Locator): Promise<() => Promise<string[]>> {
  const map = version.locator("maplace-map");
  await map.evaluate((element) => {
    const seen: string[] = [];
    const record = () => {
      const state = (element as MaplaceMapElement).loadState;
      if (seen.at(-1) !== state) seen.push(state);
      requestAnimationFrame(record);
    };
    record();
    (element as unknown as { seenStates: string[] }).seenStates = seen;
  });
  return () =>
    map.evaluate((element) => [...(element as unknown as { seenStates: string[] }).seenStates]);
}

/**
 * Whether MapLibre made its map in `version`: a canvas with a width. Only that the map was made:
 * the style asked for and the worker running prove it got going.
 */
export function mapLibreDrawn(version: Locator): Promise<boolean> {
  return version
    .locator(".maplace-maplibre-map .maplibregl-canvas")
    .evaluateAll((canvases) => canvases.some((canvas) => canvas.getBoundingClientRect().width > 0));
}

/** The URLs of `page`'s workers running maplibre-gl's worker from the site at `siteUrl`. */
export function siteWorkers(page: Page, siteUrl: string): readonly string[] {
  const { origin } = new URL(siteUrl);
  return page
    .workers()
    .map((worker) => worker.url())
    .filter((url) => url.startsWith(origin) && url.includes("maplibre-gl-worker"));
}

/** The warnings `page` logs from now on that MapLibre's stylesheet is missing. */
export function missingStylesheetWarnings(page: Page): () => readonly string[] {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes(MISSING_STYLESHEET)) warnings.push(message.text());
  });
  return () => warnings;
}

import { onTestFinished } from "vitest";
import { page } from "vitest/browser";
import type { Attachable } from "../../testing/attachable";
import { queried } from "../../testing/queried";
import { creditedOptions, onMapLibreIn } from "./control-site";

/** The height of the maps `mapOfWidthIn` makes. */
const MAP_HEIGHT = 600;

/** OpenFreeMap's credit, as its styles give it: two lines of MapLibre's attribution on a phone. */
const OPENFREEMAP_CREDIT = [
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a>',
  '<a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a>',
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
].join(" ");

/** The test style credited as OpenFreeMap's are. */
const OPENFREEMAP_CREDITED_OPTIONS = creditedOptions(OPENFREEMAP_CREDIT);

/**
 * `maplace` attached to MapLibre on a map it creates, `width` px wide and credited as OpenFreeMap,
 * the screen sized to show it until the test ends: the adapter, the map, its container, and the
 * attribution MapLibre shows.
 */
export async function mapOfWidthIn(maplace: Attachable, width: number) {
  const before = { width: window.innerWidth, height: window.innerHeight };
  await page.viewport(width + 16, MAP_HEIGHT + 200);
  onTestFinished(() => page.viewport(before.width, before.height));
  const container = document.createElement("div");
  container.style.cssText = `width: ${width}px; height: ${MAP_HEIGHT}px`;
  document.body.append(container);
  const site = await onMapLibreIn(maplace, container, OPENFREEMAP_CREDITED_OPTIONS);
  const attribution = () => queried(site.map.getContainer(), ".maplibregl-ctrl-attrib");
  return { ...site, attribution };
}

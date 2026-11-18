import { createMapLibreAdapter } from "../maplibre/index";
import type { RouteComputer } from "../route-request";
import { child } from "../validate/fail";
import { checkFunction } from "../validate/values";
import { defineBuiltInProvider } from "./built-in-provider";
import { MAP_ELEMENT } from "./element-error";
import type { MaplaceMapElement, ProviderFactory } from "./index";
import { MAPLIBRE_MAP_SETTINGS, mapLibreSettingsOf, mapStyleHostOf } from "./maplibre-attributes";

/**
 * Registers the `maplibre` provider for `<maplace-map>`; the MapLibre CDN script is this entry
 * bundled, with maplibre-gl, its worker and its stylesheet.
 *
 * Provider attributes, read when the map opens, a change of any opening the map again where it
 * was: `map-style` (a style URL, or a JSON style object, as `mapStyle`; OpenFreeMap's `bright`
 * when left out), `map-options` (a JSON object of MapLibre's map options, as `mapOptions`: not its
 * container, style, centre, zoom or bounds), and `globe` (the earth as a globe, with a toggle to
 * flatten it, as `globe`), with `globe-position` (the toggle's corner) and `globe-label` (its
 * words). The element's `computeRoute` property, read when the map opens too, is the page's
 * routing, through which a route draws. `color-scheme` isn't read: the style sets the colours. An
 * npm page installs maplibre-gl and imports its stylesheet; the CDN script needs neither. A held
 * map's panel names OpenFreeMap, or the host of a `map-style` URL; another style has no one host to
 * name, and the panel shows only its button.
 */
const mapLibreProvider: ProviderFactory = (element) =>
  createMapLibreAdapter({
    ...mapLibreSettingsOf(element),
    computeRoute: computeRouteOf(element),
  });

/** The page's routing on the element, read when the map opens; not a function is misuse. */
function computeRouteOf({ computeRoute }: MaplaceMapElement): RouteComputer | undefined {
  if (computeRoute !== undefined) checkFunction(computeRoute, child(MAP_ELEMENT, "computeRoute"));
  return computeRoute;
}

defineBuiltInProvider("maplibre", mapLibreProvider, {
  mapSettings: MAPLIBRE_MAP_SETTINGS,
  loadSource: mapStyleHostOf,
});

export type { MaplaceMapElement } from "./index";

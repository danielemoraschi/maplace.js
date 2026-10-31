import { createMapLibreAdapter } from "../maplibre/index";
import { defineBuiltInProvider } from "./built-in-provider";
import type { ProviderFactory } from "./index";
import { MAPLIBRE_MAP_SETTINGS, mapLibreSettingsOf, mapStyleHostOf } from "./maplibre-attributes";

/**
 * Registers the `maplibre` provider for `<maplace-map>`; the MapLibre CDN script is this entry
 * bundled, with maplibre-gl, its worker and its stylesheet.
 *
 * Provider attributes, read when the map opens, a change of either opening the map again where it
 * was: `map-style` (a style URL, or a JSON style object, as `mapStyle`; OpenFreeMap's `bright`
 * when left out) and `map-options` (a JSON object of MapLibre's map options, as `mapOptions`: not
 * its container, style, centre, zoom or bounds). `color-scheme` isn't read: the style sets the
 * colours. An npm page installs maplibre-gl and imports its stylesheet; the CDN script needs
 * neither. A held map's panel names OpenFreeMap, or the host of a `map-style` URL; another style
 * has no one host to name, and the panel shows only its button.
 */
const mapLibreProvider: ProviderFactory = (element) =>
  createMapLibreAdapter(mapLibreSettingsOf(element));

defineBuiltInProvider("maplibre", mapLibreProvider, {
  mapSettings: MAPLIBRE_MAP_SETTINGS,
  loadSource: mapStyleHostOf,
});

export type { MaplaceMapElement } from "./index";

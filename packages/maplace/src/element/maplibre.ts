import { createMapLibreAdapter } from "../maplibre/index";
import { defineProvider } from "./define";
import type { ProviderFactory } from "./index";
import { mapLibreSettingsOf } from "./maplibre-attributes";

/**
 * Registers the `maplibre` provider for `<maplace-map>`; the MapLibre CDN script is this entry
 * bundled, with maplibre-gl, its worker and its stylesheet.
 *
 * Provider attributes, read when the map opens, a change of either opening the map again where it
 * was: `map-style` (a style URL, or a JSON style object, as `mapStyle`; OpenFreeMap's `liberty`
 * when left out) and `map-options` (a JSON object of MapLibre's map options, as `mapOptions`: not
 * its container, style, centre, zoom or bounds). `color-scheme` isn't read: the style sets the
 * colours. An npm page installs maplibre-gl and imports its stylesheet; the CDN script needs
 * neither.
 */
const mapLibreProvider: ProviderFactory = (element) =>
  createMapLibreAdapter(mapLibreSettingsOf(element));

defineProvider("maplibre", mapLibreProvider);

export type { MaplaceMapElement } from "./index";

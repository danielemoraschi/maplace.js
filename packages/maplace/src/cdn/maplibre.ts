/**
 * The MapLibre CDN script: `<maplace-map>` on MapLibre, and, as the page's `Maplace`, what the
 * npm entries `@maplacejs/maplace`, `@maplacejs/maplace/maplibre` and `@maplacejs/maplace/element`
 * export, with the maplibre-gl the script bundles as `maplibre`: a page's own MapLibre map is made
 * with the same copy.
 */
import "../element/maplibre";

export * as maplibre from "maplibre-gl";
export * from "../element/index";
export * from "../index";
export * from "../maplibre/index";

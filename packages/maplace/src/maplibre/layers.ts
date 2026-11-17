import type {
  DataDrivenPropertyValueSpecification,
  FilterSpecification,
  LayerSpecification,
  Map as MapLibreMap,
} from "maplibre-gl";
import { addPinImage, PIN_IMAGE } from "./pin-image";
import { whenStyleLoaded } from "./style-load";

/** Where default markers are: a pin each, stacked in the order added. */
export const PIN_SOURCE = "maplace-pins";
/** Where polylines, polygons and multipolygons are. */
export const SHAPE_SOURCE = "maplace-shapes";

/** maplace's own sources: what the store asked to draw. */
export const OWN_SOURCES = [PIN_SOURCE, SHAPE_SOURCE] as const;

const PIN_LAYER = "maplace-pins";
const LINE_LAYER = "maplace-lines";
const OUTLINE_LAYER = "maplace-outlines";
const FILL_LAYER = "maplace-fills";

/** maplace's layers, front first: pins over lines, lines over areas' outlines over their fills. */
export const LOCATION_LAYERS = [PIN_LAYER, LINE_LAYER, OUTLINE_LAYER, FILL_LAYER] as const;

/** A heatmap's layers (`heat-layers.ts`), on a map whose store asks for one: dots, then heat. */
export const HEAT_DOTS_LAYER = "maplace-heat-dots";
export const HEAT_LAYER = "maplace-heat";

/** The layers a pointer finds a location in (their hits sorted front first): a dot is a marker. */
export const POINTED_LAYERS = [...LOCATION_LAYERS, HEAT_DOTS_LAYER];

/** A heat marker's feature: drawn by the heat layers, and by the pin layer only while in front. */
export const HEATED = ["has", "heat"] as const satisfies FilterSpecification;
const PINNED = ["any", ["!", HEATED], ["==", ["get", "front"], true]] as const;

export const isOwnSource = (sourceId: string) =>
  (OWN_SOURCES as readonly string[]).includes(sourceId);

/**
 * A shape's look when its style leaves a field unset, as Google draws one: a black line 3 pixels
 * wide, over a black fill at 30%.
 */
export const SHAPE_DEFAULTS = {
  stroke: "#000000",
  strokeOpacity: 1,
  strokeWidth: 3,
  fill: "#000000",
  fillOpacity: 0.3,
} as const;

/** A style field from the feature's properties, or its default. */
function styled<T extends string | number>(
  field: keyof typeof SHAPE_DEFAULTS,
): DataDrivenPropertyValueSpecification<T> {
  return ["coalesce", ["get", field], SHAPE_DEFAULTS[field]] as never;
}

const RANK = ["get", "rank"] as const;
/** An outline's place among outlines: a hovered or selected shape's over its neighbours'. */
const STROKE_RANK = ["get", "strokeRank"] as const;
const POLYGONS = ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]] as const;
const LINES = ["==", ["geometry-type"], "LineString"] as const;

const LINE_PAINT = {
  "line-color": styled<string>("stroke"),
  "line-opacity": styled<number>("strokeOpacity"),
  "line-width": styled<number>("strokeWidth"),
};

/** The layers, back first, as they are added on top of the page's style. */
const LAYERS: readonly LayerSpecification[] = [
  {
    id: FILL_LAYER,
    type: "fill",
    source: SHAPE_SOURCE,
    filter: POLYGONS as never,
    layout: { "fill-sort-key": RANK as never },
    paint: { "fill-color": styled("fill"), "fill-opacity": styled("fillOpacity") },
  },
  {
    id: OUTLINE_LAYER,
    type: "line",
    source: SHAPE_SOURCE,
    filter: POLYGONS as never,
    layout: { "line-sort-key": STROKE_RANK as never, "line-join": "round" },
    paint: LINE_PAINT,
  },
  {
    id: LINE_LAYER,
    type: "line",
    source: SHAPE_SOURCE,
    filter: LINES as never,
    layout: { "line-sort-key": STROKE_RANK as never, "line-join": "round", "line-cap": "round" },
    paint: LINE_PAINT,
  },
  {
    id: PIN_LAYER,
    type: "symbol",
    source: PIN_SOURCE,
    filter: PINNED as never,
    layout: {
      "icon-image": PIN_IMAGE,
      "icon-anchor": "bottom",
      // Every pin shown, however crowded, and every one under the pointer found.
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "symbol-sort-key": RANK as never,
    },
  },
];

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

/**
 * Adds what maplace draws on: its pin image, sources and layers, on top of the page's style.
 * Again after a restyle took them off: what is already there stays, as a page keeping maplace's
 * layers through its restyle (`transformStyle`) has them.
 */
export function addLayers(map: MapLibreMap): void {
  addPinImage(map);
  for (const source of OWN_SOURCES) {
    if (map.getSource(source) === undefined) {
      map.addSource(source, { type: "geojson", data: EMPTY, promoteId: "id" });
    }
  }
  for (const layer of LAYERS) if (map.getLayer(layer.id) === undefined) map.addLayer(layer);
}

/**
 * Takes off what `addLayers` added, as a page's own map was before. While the map has no style
 * loaded, once its next one is in: a restyle under way may keep maplace's (`transformStyle`),
 * and a map the page removed loads none, so nothing is left to do on it.
 */
export function removeLayers(map: MapLibreMap): void {
  whenStyleLoaded(map, () => takeOffLayers(map));
}

function takeOffLayers(map: MapLibreMap): void {
  for (const id of [...POINTED_LAYERS, HEAT_LAYER]) {
    if (map.getLayer(id) !== undefined) map.removeLayer(id);
  }
  for (const id of OWN_SOURCES) if (map.getSource(id) !== undefined) map.removeSource(id);
  if (map.hasImage(PIN_IMAGE)) map.removeImage(PIN_IMAGE);
}

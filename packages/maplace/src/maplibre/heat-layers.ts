import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  HeatmapLayerSpecification,
  Map as MapLibreMap,
} from "maplibre-gl";
import {
  DOT_COLORS,
  DOT_RADIUS,
  DOT_STROKE,
  HEAT_COLORS,
  HEAT_FADE_ZOOMS,
  HEAT_INTENSITY,
  HEAT_RADIUS,
  trackHeaviestHeat,
} from "../adapter-kit/heat-look";
import type { Drawable } from "../drawable";
import { toMapLibreZoom } from "./conversions";
import { HEAT_DOTS_LAYER, HEAT_LAYER, HEATED, LOCATION_LAYERS, PIN_SOURCE } from "./layers";

/**
 * A heatmap on a MapLibre map: loaded only for a store that asks for one. Its two layers read the
 * pin source's heat markers (`heat` in their properties): heat below `maxZoom`, fading over the
 * zooms before it into a dot per marker, sized and coloured by its weight against the heaviest.
 */
export interface MapLibreHeat {
  /** Adds the layers when missing, weighed against the heaviest: on open, and after a restyle. */
  add(map: MapLibreMap): void;
  /** After a diff: the heat and the dots weighed again, if the heaviest heat marker's changed. */
  drawn(map: MapLibreMap, placed: Iterable<{ drawable(): Drawable }>): void;
}

export function mapLibreHeat(maxZoom: number): MapLibreHeat {
  const end = toMapLibreZoom(maxZoom);
  const start = end - HEAT_FADE_ZOOMS;
  const heaviestHeat = trackHeaviestHeat();
  return {
    add(map) {
      const heaviest = heaviestHeat.value();
      // Behind the pins and every shape, the heat behind the dots.
      const behind = LOCATION_LAYERS.at(-1);
      // Each on its own: a page keeping maplace's layers through its restyle may keep only one.
      if (map.getLayer(HEAT_LAYER) === undefined) {
        map.addLayer(heatLayer(start, end, heaviest), behind);
      }
      if (map.getLayer(HEAT_DOTS_LAYER) === undefined) {
        map.addLayer(dotsLayer(start, end, heaviest), behind);
      }
    },
    drawn(map, placed) {
      if (!heaviestHeat.update(placed)) return;
      const heaviest = heaviestHeat.value();
      // Each on its own: a page's restyle may have kept only one (`add` puts the other back).
      if (map.getLayer(HEAT_LAYER) !== undefined) {
        map.setPaintProperty(HEAT_LAYER, "heatmap-weight", relativeWeight(heaviest));
      }
      if (map.getLayer(HEAT_DOTS_LAYER) !== undefined) {
        map.setPaintProperty(HEAT_DOTS_LAYER, "circle-radius", dotRadius(heaviest));
        map.setPaintProperty(HEAT_DOTS_LAYER, "circle-color", dotColor(heaviest));
      }
    },
  };
}

/** A marker's weight against the heaviest; all weigh nothing when the heaviest doesn't. */
function relativeWeight(heaviest: number): ExpressionSpecification {
  return ["/", ["get", "heat"], heaviest || 1];
}

/** `input` mapped linearly through `stops`, each an input and the value there. */
function interpolate(
  input: ExpressionSpecification,
  stops: readonly (readonly [number, number | string])[],
): ExpressionSpecification {
  return ["interpolate", ["linear"], input, ...stops.flat()] as ExpressionSpecification;
}

/** `from` at MapLibre's zoom `start` to `to` at `end`, linearly: a fade, or the heat's growth. */
function byZoom(start: number, end: number, from: number, to: number): ExpressionSpecification {
  return interpolate(
    ["zoom"],
    [
      [start, from],
      [end, to],
    ],
  );
}

function heatLayer(start: number, end: number, heaviest: number): HeatmapLayerSpecification {
  return {
    id: HEAT_LAYER,
    type: "heatmap",
    source: PIN_SOURCE,
    filter: HEATED,
    maxzoom: end,
    paint: {
      "heatmap-weight": relativeWeight(heaviest),
      "heatmap-radius": byZoom(0, end, HEAT_RADIUS.world, HEAT_RADIUS.region),
      "heatmap-intensity": byZoom(0, end, HEAT_INTENSITY.world, HEAT_INTENSITY.region),
      "heatmap-color": interpolate(["heatmap-density"], HEAT_COLORS),
      "heatmap-opacity": byZoom(start, end, 1, 0),
    },
  };
}

function dotsLayer(start: number, end: number, heaviest: number): CircleLayerSpecification {
  return {
    id: HEAT_DOTS_LAYER,
    type: "circle",
    source: PIN_SOURCE,
    filter: HEATED,
    minzoom: start,
    layout: { "circle-sort-key": ["get", "heat"] },
    paint: {
      "circle-radius": dotRadius(heaviest),
      "circle-color": dotColor(heaviest),
      "circle-stroke-color": DOT_STROKE.color,
      "circle-stroke-width": DOT_STROKE.width,
      "circle-opacity": byZoom(start, end, 0, 1),
      "circle-stroke-opacity": byZoom(start, end, 0, 1),
    },
  };
}

function dotRadius(heaviest: number): ExpressionSpecification {
  return interpolate(relativeWeight(heaviest), [
    [0, DOT_RADIUS.min],
    [1, DOT_RADIUS.max],
  ]);
}

/** The dots' colours by their weight against the heaviest. */
function dotColor(heaviest: number): ExpressionSpecification {
  return interpolate(relativeWeight(heaviest), DOT_COLORS);
}

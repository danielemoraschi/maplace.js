import type { MapGeoJSONFeature, Map as MapLibreMap, Point } from "maplibre-gl";
import { nearestLongitude } from "./conversions";
import { PIN_SOURCE, POINTED_LAYERS } from "./layers";
import type { MapLibreState } from "./map-state";
import type { PlacedLocation } from "./placed-location";

/** A location hit at a point, with how far its marker's middle is from there (none for a shape). */
interface Hit {
  readonly placed: PlacedLocation;
  readonly dotDistance: number | undefined;
}

/**
 * The location drawn in maplace's layers at `point`, as a user pointing there means it: of the
 * locations hit and shown now, a marker before any shape; of markers drawn over each other there
 * (pins, heat dots), the one whose middle is nearest, whatever a pin image's transparent edge
 * covers; then the one stacked in
 * front by maplace's own order (a small polygon's fill over a big one's outline, though MapLibre
 * draws every outline above every fill). A location hidden, removed or folded into a cluster since
 * MapLibre last drew is skipped: its feature may still be on screen for a frame.
 */
export function locationAt(state: MapLibreState, point: Point): string | undefined {
  const map = state.mounted?.map;
  if (map === undefined) return undefined;
  const layers = POINTED_LAYERS.filter((id) => map.getLayer(id) !== undefined);
  const hits = map
    .queryRenderedFeatures(point, { layers })
    .flatMap((feature) => shownHit(state, map, feature, point));
  hits.sort(frontFirst);
  return hits[0]?.placed.drawable().id;
}

function shownHit(
  state: MapLibreState,
  map: MapLibreMap,
  feature: MapGeoJSONFeature,
  point: Point,
): Hit[] {
  const id = feature.properties.id;
  if (typeof id !== "string" || state.presented.hiddenIds.has(id)) return [];
  if (isPinTakenOff(state, feature, id)) return [];
  const placed = state.placed.get(id);
  return placed === undefined ? [] : [{ placed, dotDistance: dotDistance(map, feature, point) }];
}

/** A pin MapLibre still draws though maplace took it off since: folded, or drawn in the DOM. */
function isPinTakenOff(state: MapLibreState, { source }: MapGeoJSONFeature, id: string): boolean {
  return source === PIN_SOURCE && state.features?.pins.featureOf(id) === undefined;
}

/**
 * How far a marker's middle (a pin's dot, a heat dot) is from `point`, in pixels, on the world copy
 * under it: MapLibre gives a feature's longitude in −180..180, whichever copy it drew. None for a
 * shape.
 */
function dotDistance(map: MapLibreMap, feature: MapGeoJSONFeature, point: Point) {
  if (feature.geometry.type !== "Point") return undefined;
  const [lng = 0, lat = 0] = feature.geometry.coordinates;
  const copy = nearestLongitude(lng, map.unproject(point).lng);
  return map.project([copy, lat]).dist(point);
}

function frontFirst(a: Hit, b: Hit): number {
  return (
    isMarker(b.placed) - isMarker(a.placed) || nearerDot(a, b) || b.placed.rank() - a.placed.rank()
  );
}

/** The hit whose middle is nearer first, when both are markers. */
function nearerDot(a: Hit, b: Hit): number {
  if (a.dotDistance === undefined || b.dotDistance === undefined) return 0;
  return a.dotDistance - b.dotDistance;
}

const isMarker = (placed: PlacedLocation) => Number(placed.geometryType === "marker");

/**
 * Whether a map event came from the map's canvas, not from something on the map (a DOM marker, a
 * popup, a control), which handles its own input, nor from a page's code firing one.
 */
export function isOnCanvas(
  { originalEvent }: { readonly originalEvent?: Event },
  canvas: HTMLCanvasElement,
): boolean {
  return originalEvent?.target === canvas;
}

/**
 * Whether `event` happened in the map's canvas container (the canvas or a marker on it), where
 * MapLibre hears it, read through any open shadow root.
 */
export function isInCanvasContainer(event: Event, map: MapLibreMap): boolean {
  return event.composedPath().includes(map.getCanvasContainer());
}

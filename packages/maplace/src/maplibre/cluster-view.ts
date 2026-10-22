import type { Map as MapLibreMap } from "maplibre-gl";
import type { LatLng } from "../geometry";
import { fromMapLibreZoom } from "./conversions";

/** The zoom clusters are grouped at: maplace's, rounded, as Google's clusterer rounds it. */
export function clusterZoomOf(map: Pick<MapLibreMap, "getZoom">): number {
  return Math.round(fromMapLibreZoom(map.getZoom()));
}

/** A box on the map, its longitudes unwrapped as MapLibre gives them: west < east, perhaps past ±180. */
export interface ViewBox {
  readonly south: number;
  readonly west: number;
  readonly north: number;
  readonly east: number;
}

/**
 * How much of the view's size is added on each side: the clusters just off the view are on the
 * page already when a pan starts, and a short pan brings none in late.
 */
const VIEW_PADDING = 0.5;

const WORLD_BOX: ViewBox = { south: -90, west: -180, north: 90, east: 180 };

const FULL_TURN = 360;

/** The view and half of it on each side, in MapLibre's unwrapped longitudes; the world when that spans it. */
export function clusterBoxOf(map: Pick<MapLibreMap, "getBounds">): ViewBox {
  const bounds = map.getBounds();
  const [south, north] = padded(bounds.getSouth(), bounds.getNorth());
  const [west, east] = padded(bounds.getWest(), bounds.getEast());
  if (east - west >= FULL_TURN) return WORLD_BOX;
  return { south: Math.max(south, -90), west, north: Math.min(north, 90), east };
}

function padded(low: number, high: number): readonly [number, number] {
  const padding = (high - low) * VIEW_PADDING;
  return [low - padding, high + padding];
}

/** Whether `at`, or a world copy of it, is in `box`. */
export function isInBox({ lat, lng }: LatLng, box: ViewBox): boolean {
  if (lat < box.south || lat > box.north) return false;
  const firstCopyEastOfWest = box.west + positiveModulo(lng - box.west, FULL_TURN);
  return firstCopyEastOfWest <= box.east;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

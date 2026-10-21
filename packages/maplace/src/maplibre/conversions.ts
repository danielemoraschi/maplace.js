import type { LngLatBounds, LngLatLike } from "maplibre-gl";
import type { LatLng } from "../geometry";
import { wrapLongitude } from "../longitude-arc";
import type { Bounds } from "../viewport";

/**
 * maplace's zoom is Google's, on 256-pixel tiles; MapLibre's is on 512-pixel tiles, one less for
 * the same scale.
 */
const ZOOM_OFFSET = 1;

export const toMapLibreZoom = (zoom: number) => zoom - ZOOM_OFFSET;
export const fromMapLibreZoom = (zoom: number) => zoom + ZOOM_OFFSET;

/** A longitude in −180..180, 180 kept east: MapLibre's world copies give longitudes past ±180. */
export function wrappedLongitude(lng: number): number {
  const wrapped = wrapLongitude(lng);
  return wrapped === -180 && lng > 0 ? 180 : wrapped;
}

/** A point MapLibre gives, as maplace's, its longitude wrapped. */
export function wrappedLatLng({ lat, lng }: LatLng): LatLng {
  return { lat, lng: wrappedLongitude(lng) };
}

/** A point as MapLibre takes it. */
export function lngLatOf({ lat, lng }: LatLng): LngLatLike {
  return [lng, lat];
}

/**
 * What the map shows, in maplace's bounds: longitudes wrapped, west > east across ±180°, and a
 * view as wide as the world or wider as the whole world.
 */
export function boundsOf(bounds: LngLatBounds): Bounds {
  const south = bounds.getSouth();
  const north = bounds.getNorth();
  const west = bounds.getWest();
  const east = bounds.getEast();
  if (east - west >= 360) return { south, west: -180, north, east: 180 };
  return { south, west: wrappedLongitude(west), north, east: wrappedLongitude(east) };
}

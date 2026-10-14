/// <reference types="google.maps" />
import type { LatLng } from "../geometry";

type GooglePoint =
  | google.maps.LatLng
  | google.maps.LatLngLiteral
  | google.maps.LatLngAltitude
  | google.maps.LatLngAltitudeLiteral;

/** A point as Google gives one, in maplace's terms: without the altitude a marker drag adds. */
export function latLngOf(point: GooglePoint): LatLng {
  const { lat, lng } = "toJSON" in point ? point.toJSON() : point;
  return { lat, lng };
}

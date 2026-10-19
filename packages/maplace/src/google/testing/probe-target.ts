/// <reference types="google.maps" />
import type { Geometry, LatLng } from "../../geometry";
import type { LocationOnMap } from "../../testing/map-probe";

/** One placed location as the probe sees and drives it, through Google's own objects. */
export interface ProbeTarget {
  readonly isMarker: boolean;
  onMap(): boolean;
  /** On the map and not hidden: what a user can see and reach. */
  shown(): boolean;
  read(): LocationOnMap;
  /** Where it stacks within its layer, higher in front. */
  stack(): number;
  click(): void;
  pointerOver(): void;
  pointerOut(): void;
  /** Edits it as a user would, one handle at a time; nothing when it isn't editable. */
  drag(geometry: Geometry): void;
}

/**
 * A point Google holds, as the probe reports it: not a number when there is none. Read from
 * Google's object here, by design not through the adapter's `latLngOf`, so the probe can't share
 * the adapter's mistakes.
 */
export function probedPoint(
  point: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined,
): LatLng {
  if (point == null) return { lat: Number.NaN, lng: Number.NaN };
  if (point instanceof google.maps.LatLng) return point.toJSON();
  return { lat: point.lat, lng: point.lng };
}

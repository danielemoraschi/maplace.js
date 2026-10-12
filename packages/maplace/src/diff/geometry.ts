import type { Geometry } from "../geometry";
import type { Location, MarkerLocation } from "../location";

/**
 * Where a location is, as adapters receive it; paths and centres keep their reference. Each
 * type always writes the same keys, so geometries compare field by field.
 */
export function geometryOf(location: Location): Geometry {
  switch (location.type) {
    case undefined:
    case "marker":
      return { type: "marker", lat: location.lat, lng: location.lng };
    case "circle":
      return { type: "circle", center: location.center, radius: location.radius };
    case "polyline":
      return { type: "polyline", path: location.path };
    case "polygon":
      return { type: "polygon", path: location.path, holes: location.holes };
  }
}

/** A location without `type` is a marker. */
export function geometryTypeOf(location: Location): Geometry["type"] {
  return location.type ?? "marker";
}

export function isMarker(location: Location): location is MarkerLocation {
  return geometryTypeOf(location) === "marker";
}

import type { Geometry } from "../geometry";
import type { Location, MarkerLocation } from "../location";
import { frozenPath, frozenPoint } from "./frozen";

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

/**
 * `location` with its geometry replaced: the inverse of `geometryOf`, for a geometry of the
 * location's own type. Points are copied and frozen, so whoever reported them can't change them;
 * `type` is left as the location has it, so a marker written back never gains one.
 */
export function withGeometry<Data>(location: Location<Data>, geometry: Geometry): Location<Data> {
  return { ...location, ...frozenFields(geometry) } as Location<Data>;
}

/** A location without `type` is a marker. */
export function geometryTypeOf(location: Location): Geometry["type"] {
  return location.type ?? "marker";
}

export function isMarker(location: Location): location is MarkerLocation {
  return geometryTypeOf(location) === "marker";
}

/** A geometry's own fields, without `type`, with its points copied and frozen. */
function frozenFields(geometry: Geometry): Partial<Location> {
  switch (geometry.type) {
    case "marker":
      return { lat: geometry.lat, lng: geometry.lng };
    case "circle":
      return { center: frozenPoint(geometry.center), radius: geometry.radius };
    case "polyline":
      return { path: frozenPath(geometry.path) };
    case "polygon":
      return {
        path: frozenPath(geometry.path),
        holes: geometry.holes && Object.freeze(geometry.holes.map(frozenPath)),
      };
  }
}

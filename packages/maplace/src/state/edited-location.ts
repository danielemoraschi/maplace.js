import { geometryTypeOf, withGeometry } from "../diff/geometry";
import type { Geometry } from "../geometry";
import type { Location } from "../location";
import { child, reject } from "../validate/fail";
import { checkLocationFields, locationRoot } from "../validate/location";

/** What the map reports of a user's drag or edit of one location. */
export interface GeometryReport {
  readonly id: string;
  readonly geometry: Geometry;
}

/**
 * `previous` with the reported geometry, checked: an edit of a location that isn't editable, of
 * another type, or out of range is the adapter's bug and throws.
 */
export function editedLocation<Data>(previous: Location<Data>, geometry: Geometry): Location<Data> {
  checkEditable(previous, geometry);
  const location = withGeometry(previous, geometry);
  checkLocationFields(location);
  return location;
}

function checkEditable(location: Location, geometry: Geometry): void {
  if (location.editable !== true) {
    const problem = "is not true, so the map can't change its geometry";
    reject(child(locationRoot(location.id), "editable"), problem);
  }
  const type = geometryTypeOf(location);
  if (geometry.type !== type) {
    const problem = `is ${type}, got a ${geometry.type} geometry`;
    reject(child(locationRoot(location.id), "type"), problem);
  }
}

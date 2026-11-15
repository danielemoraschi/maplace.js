import type { Geometry } from "../geometry";
import { ringArea } from "../sphere";

/**
 * How much of the map `geometry` covers within its outline, in square metres: a polygon's holes
 * count, as a shape inside one lies within its outline; a multipolygon is its polygons together;
 * none for a line or a marker.
 */
export function areaOf(geometry: Geometry): number {
  switch (geometry.type) {
    case "circle":
      return Math.PI * geometry.radius ** 2;
    case "polygon":
      return ringArea(geometry.path);
    case "multipolygon":
      return geometry.polygons.reduce((total, { path }) => total + ringArea(path), 0);
    default:
      return 0;
  }
}

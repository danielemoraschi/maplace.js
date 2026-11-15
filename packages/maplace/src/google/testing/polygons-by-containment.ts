import type { LatLng, PolygonRings } from "../../geometry";

type Ring = readonly LatLng[];

/**
 * Google's flat list of a polygon's rings as the polygons they draw: a ring whose first point is
 * inside an earlier outline is that outline's hole, any other ring an outline of its own. Read
 * from Google's rings alone, as the probe reads everything, never from what the adapter kept.
 */
export function polygonsByContainment(rings: readonly Ring[]): PolygonRings[] {
  const polygons: { path: Ring; holes: Ring[] }[] = [];
  for (const ring of rings) {
    const outline = polygons.find(({ path }) => ring[0] !== undefined && isInside(ring[0], path));
    if (outline) outline.holes.push(ring);
    else polygons.push({ path: ring, holes: [] });
  }
  return polygons.map(({ path, holes }) => ({
    path,
    holes: holes.length > 0 ? holes : undefined,
  }));
}

/** Ray casting on the flat coordinates: enough for the probe's small test shapes. */
function isInside(point: LatLng, ring: Ring): boolean {
  let inside = false;
  ring.forEach((corner, index) => {
    const previous = ring.at(index - 1) ?? corner;
    const crosses = corner.lat > point.lat !== previous.lat > point.lat;
    const lngAtLat =
      ((previous.lng - corner.lng) * (point.lat - corner.lat)) / (previous.lat - corner.lat) +
      corner.lng;
    if (crosses && point.lng < lngAtLat) inside = !inside;
  });
  return inside;
}

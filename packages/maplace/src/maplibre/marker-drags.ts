import type { Marker } from "maplibre-gl";
import { editReportsFor } from "../adapter-kit/edit-reports";
import type { MarkerGeometry } from "../geometry";
import { wrappedLatLng } from "./conversions";
import type { MountedMapLibre } from "./mounted-map";

/** A user's drags of one DOM marker. */
export interface MarkerDrags {
  /** A drag has moved the marker and not been let go. */
  isUnderWay(): boolean;
}

/**
 * Reports each drag of `marker` as `id`'s edits as it goes and its change once, on release
 * (MapLibre fires `drag` as it moves and `dragend` once). While dragged, the marker's element lets
 * the pointer through, so the release's click lands on neither it nor the map's canvas, selecting
 * nothing and clicking nothing on the map.
 */
export function reportMarkerDrags(
  marker: Marker,
  id: string,
  mounted: MountedMapLibre,
): MarkerDrags {
  const edits = editReportsFor(id, mounted.live);
  let underWay = false;
  marker.on("drag", () => {
    underWay = true;
    edits.moving(markerGeometryOf(marker));
  });
  marker.on("dragend", () => {
    underWay = false;
    edits.ended(markerGeometryOf(marker));
  });
  return { isUnderWay: () => underWay };
}

function markerGeometryOf(marker: Marker): MarkerGeometry {
  return { type: "marker", ...wrappedLatLng(marker.getLngLat()) };
}

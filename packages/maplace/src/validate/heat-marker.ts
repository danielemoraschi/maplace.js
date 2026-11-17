import type { Location } from "../location";
import { type HeatmapOptions, isHeatMarker } from "../options";
import { child, type Field, reject } from "./fail";

/** A heat marker is drawn as heat and a dot: no page icon, and nothing to drag. */
export function checkHeatMarker(
  location: Location,
  heatmap: HeatmapOptions | undefined,
  field: Field,
): void {
  if (!isHeatMarker(location, heatmap)) return;
  if (location.icon !== undefined) {
    reject(child(field, "icon"), `${DRAWN_AS_HEAT}: it can't have an icon`);
  }
  if (location.editable === true) {
    reject(child(field, "editable"), `${DRAWN_AS_HEAT}: it can't be editable`);
  }
}

const DRAWN_AS_HEAT = "is in the heatmap, drawn as heat and a dot";

import type { LineParts } from "../adapter-kit/line-parts";
import type { FeatureSet, LocationProperties } from "./feature-set";
import { featureStyleFields, lineGeometryOf } from "./location-features";

/** Where a split line's parts stack among outlines: just over the line, below what is in front. */
export const PART_LIFT = 0.5;

/** The keys of a line's two parts in their source. */
export interface PartKeys {
  readonly travelled: string;
  readonly ahead: string;
}

/** What each part's feature carries besides its key and style: the line it draws, where it stacks. */
type PartProperties = Omit<LocationProperties, "key">;

/**
 * Puts each of `parts` in `set` under its key, with `properties` and its own style, and takes off
 * a part there is none of (one with no length): a split polyline's in the shape source, the
 * route's in its own.
 */
export function putParts(
  set: FeatureSet,
  keys: PartKeys,
  parts: LineParts,
  properties: PartProperties,
): void {
  for (const name of ["travelled", "ahead"] as const) {
    const part = parts[name];
    if (part === undefined) set.remove(keys[name]);
    else {
      set.put({
        type: "Feature",
        geometry: lineGeometryOf(part.path),
        properties: { ...properties, key: keys[name], ...featureStyleFields(part.style) },
      });
    }
  }
}

/** Takes both of a line's parts off `set`. */
export function removeParts(set: FeatureSet, keys: PartKeys): void {
  set.remove(keys.travelled);
  set.remove(keys.ahead);
}

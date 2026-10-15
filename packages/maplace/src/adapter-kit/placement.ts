import type { LocationState } from "../location";

/** Where a clustering map puts a marker: in no cluster, on its own, or in a cluster. */
export type Placement = "hidden" | "alone" | "clustered";

/**
 * Every clustering map's rule (RFC): a hidden location is in no cluster, and the selected one
 * stands on its own, where a selection from the list reaches it and its popup points at it.
 */
export function placementOf(visible: boolean, { selected }: LocationState): Placement {
  if (!visible) return "hidden";
  return selected ? "alone" : "clustered";
}

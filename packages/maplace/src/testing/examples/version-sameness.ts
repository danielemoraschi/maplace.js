import type { Maplace } from "../../index";
import type { Location } from "../../location";

/**
 * What makes two versions of an example the same map: every location field but how its popup
 * and marker are given (`content`, `icon`, and React's own fields in `data`, which the
 * behaviours check by what they draw), its route, filter and selection.
 */
export function comparableSnapshot(store: Maplace): unknown {
  const { locations, route, filter, selectedId } = store.getSnapshot();
  return { locations: locations.map(withoutPresentation), route, filter, selectedId };
}

const PRESENTATION: ReadonlySet<string> = new Set(["content", "icon", "data"]);

function withoutPresentation(location: Location): Partial<Location> {
  return Object.fromEntries(Object.entries(location).filter(([key]) => !PRESENTATION.has(key)));
}

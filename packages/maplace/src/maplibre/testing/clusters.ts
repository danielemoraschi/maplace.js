import type { MapProbe } from "../../testing/map-probe";

/** The clusters on the page under `container`, by their elements, with their counts. */
export function clustersOn(container: HTMLElement) {
  const elements = [...container.querySelectorAll<HTMLElement>("[aria-label^='Cluster of']")];
  const counts = elements.map((element) => Number(element.textContent));
  return { elements, counts };
}

/** How many of `ids` the map shows: in clusters, or alone. */
export function shownTotal(container: HTMLElement, probe: MapProbe, ids: readonly string[]) {
  const clustered = clustersOn(container).counts.reduce((sum, count) => sum + count, 0);
  const alone = ids.filter((id) => probe.location(id)?.visible).length;
  return clustered + alone;
}

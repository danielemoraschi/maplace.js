import type { Map as MapLibreMap } from "maplibre-gl";

/** The documents already told, so a page with many maps hears it once. */
const warned = new WeakSet<Document>();

/**
 * Warns once per document when MapLibre's own stylesheet isn't on the page: without it, markers
 * and popups are drawn in the wrong place. Not an error: the map itself still draws. Checked with
 * a marker's class in the map's container, so a stylesheet in its shadow root counts too.
 */
export function warnOfMissingStylesheetOnce(map: MapLibreMap): void {
  const container = map.getContainer();
  const document = container.ownerDocument;
  if (warned.has(document) || hasStylesheet(container)) return;
  warned.add(document);
  console.warn(
    "maplace: MapLibre's stylesheet is missing, so markers and popups are misplaced: " +
      'import "maplibre-gl/dist/maplibre-gl.css", or link it in the page',
  );
}

function hasStylesheet(container: HTMLElement): boolean {
  const probe = container.ownerDocument.createElement("div");
  probe.className = "maplibregl-marker";
  container.append(probe);
  const placed = getComputedStyle(probe).position === "absolute";
  probe.remove();
  return placed;
}

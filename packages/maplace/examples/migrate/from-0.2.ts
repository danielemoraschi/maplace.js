// Converting 0.2 locations: ids from the old 1-based index, `lon` → `lng`, `zoom` kept.
import { createMaplace, type MarkerLocation } from "maplace";

interface Legacy {
  readonly lat: number;
  readonly lon: number;
  readonly title?: string;
  readonly html?: string;
  readonly icon?: string;
  readonly zoom?: number;
}

function toLocation(legacy: Legacy, index: number): MarkerLocation {
  const { lat, lon, title, html, icon, zoom } = legacy;
  return { id: String(index + 1), lat, lng: lon, title, html, icon, zoom };
}

declare const old: readonly Legacy[];
declare const sanitize: (html: string) => string; // e.g. DOMPurify.sanitize

const locations = old.map((legacy, index) => toLocation(legacy, index));
const maplace = createMaplace({ locations, sanitize });
// 0.2's `ViewOnMap(1)`, at the location's own zoom:
const [first] = maplace.getSnapshot().locations;
if (first) maplace.select(first.id);

// Converting 0.2 locations: ids from the old 1-based index, `lon` → `lng`, extras into `data`.
import { createMaplace, type MarkerLocation } from "maplace";

interface Legacy {
  readonly lat: number;
  readonly lon: number;
  readonly title?: string;
  readonly html?: string;
  readonly icon?: string;
  readonly zoom?: number;
}

type LegacyData = { readonly zoom: number | undefined };

function toLocation(legacy: Legacy, index: number): MarkerLocation<LegacyData> {
  const { lat, lon, title, html, icon, zoom } = legacy;
  return { id: String(index + 1), lat, lng: lon, title, html, icon, data: { zoom } };
}

declare const old: readonly Legacy[];
declare const sanitize: (html: string) => string; // e.g. DOMPurify.sanitize

const maplace = createMaplace({ locations: old.map(toLocation), sanitize });
// 0.2's `ViewOnMap(1)` with the location's own zoom:
const [first] = maplace.getSnapshot().locations;
if (first) maplace.select(first.id, { zoom: first.data?.zoom });

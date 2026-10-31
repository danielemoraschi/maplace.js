import { anchorOf } from "../anchor";
import type { LatLng } from "../geometry";
import type { Location } from "../location";
import { metresBetween } from "../sphere";
import { child, root } from "../validate/fail";
import { checkLatLng } from "../validate/geometry";
import type { Distances, EntryDistance } from "./model";

/** Metres in a straight line from `origin` to `location`: a shape, to where its popup points. */
export function distanceTo(origin: LatLng, location: Location): number {
  const field = root("distanceTo");
  checkLatLng(origin, child(field, "origin"));
  const anchor = anchorOf(location);
  checkLatLng(anchor, child(field, "location"));
  return metresBetween(origin, anchor);
}

/** Turns metres into what a list shows. */
export type DistanceLabel = (metres: number) => string;

/**
 * `entries`, nearest first (ties in data order), and how far each is from `origin`, the store's,
 * already checked.
 */
export function sortedByDistance<Data>(
  entries: readonly Location<Data>[],
  origin: LatLng,
  label: DistanceLabel,
): { readonly listing: readonly Location<Data>[]; readonly distances: Distances } {
  const of = new Map<string, EntryDistance>();
  const measured = entries.map((entry) => {
    const metres = metresBetween(origin, anchorOf(entry));
    of.set(entry.id, { metres, label: label(metres) });
    return { entry, metres };
  });
  measured.sort((a, b) => a.metres - b.metres);
  return { listing: measured.map(({ entry }) => entry), distances: { from: origin, of } };
}

/** How many metres a unit a distance is written in holds. */
const METRES_IN = { kilometer: 1000, mile: 1609.344 } as const;

/** A distance as the visitor's language writes it, to two figures: "0.85 km", "12 km", "1,200 km". */
export function distanceLabelIn(unit: keyof typeof METRES_IN = "kilometer"): DistanceLabel {
  const { format } = new Intl.NumberFormat(undefined, {
    style: "unit",
    unit,
    maximumSignificantDigits: 2,
  });
  return (metres) => format(metres / METRES_IN[unit]);
}

import type { Location } from "../../location";

/** A few places, or `count` of them, within one fit. */
export function places(count = 3): Location[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index}`,
    lat: 40 + (index % 6),
    lng: 5 + Math.floor(index / 6) * 2,
    title: `Place ${index}`,
  }));
}

import type { Location } from "../../location";

/** Three markers, for selections and filters: `north` in group N, `south` in S, `east` in neither. */
export const TOWNS: readonly Location[] = [
  { id: "north", lat: 46, lng: 11, group: "N" },
  { id: "south", lat: 40, lng: 16, group: "S" },
  { id: "east", lat: 43, lng: 13 },
];

import type { LatLng } from "../geometry";
import type { Bounds } from "../viewport";

// The store keeps its own frozen copies of coordinates it is handed (views, reports from the
// map), so no caller can change them later.

export function frozenPoint({ lat, lng }: LatLng): LatLng {
  return Object.freeze({ lat, lng });
}

export function frozenPath(path: readonly LatLng[]): readonly LatLng[] {
  return Object.freeze(path.map(frozenPoint));
}

export function frozenBounds({ south, west, north, east }: Bounds): Bounds {
  return Object.freeze({ south, west, north, east });
}

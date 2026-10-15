import type { Geometry, LatLng } from "../geometry";

type Ring = readonly LatLng[];

/**
 * Whether two geometries put a location in the same place, compared by value: a map reads back a
 * new object for what it shows, and the store writes back a copy of what the map reported.
 */
export function sameGeometry(a: Geometry, b: Geometry): boolean {
  switch (a.type) {
    case "marker":
      return b.type === "marker" && samePoint(a, b);
    case "circle":
      return b.type === "circle" && a.radius === b.radius && samePoint(a.center, b.center);
    case "polyline":
      return b.type === "polyline" && sameRing(a.path, b.path);
    case "polygon":
      return (
        b.type === "polygon" &&
        sameRing(a.path, b.path) &&
        sameList(a.holes ?? [], b.holes ?? [], sameRing)
      );
  }
}

export function samePoint(a: LatLng, b: LatLng): boolean {
  return a.lat === b.lat && a.lng === b.lng;
}

function sameRing(a: Ring, b: Ring): boolean {
  return sameList(a, b, samePoint);
}

/** The same items in the same order, each compared by `same`. */
export function sameList<T>(
  a: readonly T[],
  b: readonly T[],
  same: (a: T, b: T) => boolean,
): boolean {
  // Same length, so every index of `a` is one of `b`.
  return a.length === b.length && a.every((item, index) => same(item, b[index] as T));
}

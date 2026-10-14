/** The shortest arc holding every longitude: all of them but the widest gap between two. */
export function narrowestArc(longitudes: readonly number[]): { west: number; east: number } {
  const sorted = Float64Array.from(longitudes).sort();
  const first = sorted[0] ?? 0;
  let previous = first;
  let widestGap = 0;
  let arc = { west: first, east: first };
  for (const lng of sorted) {
    if (lng - previous > widestGap) {
      widestGap = lng - previous;
      arc = { west: lng, east: previous };
    }
    previous = lng;
  }
  // `previous` is now the easternmost longitude. The gap across ±180 wins a tie, so the box
  // crosses the antimeridian only when that is strictly narrower.
  return first + 360 - previous >= widestGap ? { west: first, east: previous } : arc;
}

/** The degrees an arc spans; one with west > east crosses ±180. */
export function arcSpan({ west, east }: { readonly west: number; readonly east: number }): number {
  return west > east ? east + 360 - west : east - west;
}

/** A longitude brought into -180..180. */
export function wrapLongitude(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

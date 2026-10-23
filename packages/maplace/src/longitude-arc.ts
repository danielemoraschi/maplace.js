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

/**
 * A longitude brought into -180..180, 180 itself as -180. One already in range comes back as it
 * is: the modulo would add float error (0.6 read back as 0.6000000000000227).
 */
export function wrapLongitude(lng: number): number {
  if (lng >= -180 && lng < 180) return lng;
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

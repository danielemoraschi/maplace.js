/** Web Mercator stops here; providers clamp latitudes to it. */
export const MAX_LATITUDE = 85.051_128_78;

/** Where `lat` is on the Mercator plane, 0 at its north edge and 1 at its south. */
export function yOf(lat: number): number {
  const clamped = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat));
  const sin = Math.sin((clamped * Math.PI) / 180);
  return 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
}

/** The latitude at `y` on the Mercator plane, `yOf` undone. */
export function latOf(y: number): number {
  const clamped = Math.max(0, Math.min(1, y));
  return (Math.atan(Math.sinh(Math.PI * (1 - 2 * clamped))) * 180) / Math.PI;
}

/** Where the site answers its repository's star count, from its own Worker (W44). */
export const STAR_COUNT_PATH = "/api/stars";

/** What the site answers there. */
export interface StarCount {
  readonly stars: number;
}

/** Whether `value` is a star count: an object whose `stars` is a whole number, not negative. */
export function isStarCount(value: unknown): value is StarCount {
  if (typeof value !== "object" || value === null || !("stars" in value)) return false;
  const { stars } = value;
  return typeof stars === "number" && Number.isSafeInteger(stars) && stars >= 0;
}

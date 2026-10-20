import type * as Google from "maplace/google";

/** `maplace/google`'s two calls that make a map, as the site gives them its map ID. */
export type GoogleEntry = Pick<typeof Google, "createGoogleAdapter" | "createGoogleMap">;

/**
 * `google`'s calls with `mapId` as the map ID an example leaves out, so the site's maps run on
 * the site's own map ID; an example's own `mapId` stays. Without one they are `google`'s own.
 */
export function googleWithMapId(google: GoogleEntry, mapId: string | undefined): GoogleEntry {
  if (mapId === undefined) return google;
  const { createGoogleAdapter, createGoogleMap } = google;
  return {
    createGoogleAdapter: (options = {}) => createGoogleAdapter({ mapId, ...options }),
    createGoogleMap: (container, options = {}) => createGoogleMap(container, { mapId, ...options }),
  };
}

import type { LatLng } from "./geometry";

/**
 * A box on the map, in degrees. Longitudes stay within -180..180; `west` greater than
 * `east` means the box crosses the antimeridian.
 */
export interface Bounds {
  readonly south: number;
  readonly west: number;
  readonly north: number;
  readonly east: number;
}

/** The visible area, as the provider reports it. */
export interface Viewport {
  readonly center: LatLng;
  /** The world is 256 px wide at zoom 0; adapters for 512 px tile providers subtract 1. */
  readonly zoom: number;
  readonly bounds: Bounds;
}

/**
 * What the map should show. Zooms as in `Viewport`. A fit never zooms in past 15: a box that
 * would need more (one location, or locations metres apart) is centred at 15.
 */
export type View =
  | { readonly kind: "fit-all"; readonly padding: number }
  | { readonly kind: "fit-bounds"; readonly bounds: Bounds; readonly padding: number }
  | { readonly kind: "center"; readonly center: LatLng; readonly zoom: number }
  /**
   * Bring one location into view, as `select` does: a marker to the centre, keeping the zoom; a
   * shape fitted, no closer than 15. With a `zoom`, either is brought to the point its popup
   * points at, at that zoom.
   */
  | { readonly kind: "location"; readonly id: string; readonly zoom: number | undefined };

/**
 * What adapters receive: the store resolves `fit-all` to `fit-bounds` around the visible locations
 * in one pass, taking the narrower box with or without crossing the antimeridian. With nothing
 * visible it sends no view and the camera stays, until locations are shown: then it fits them.
 */
export type ResolvedView = Exclude<View, { readonly kind: "fit-all" }>;

/**
 * Selecting brings the location into view by default (a marker panned to, a shape fitted);
 * `zoom` centres either at that zoom.
 */
export type SelectOptions =
  | { readonly pan?: true | undefined; readonly zoom?: number | undefined }
  | { readonly pan: false };

export interface FitOptions {
  /** Padding in pixels. Default 40. */
  readonly padding?: number | undefined;
}

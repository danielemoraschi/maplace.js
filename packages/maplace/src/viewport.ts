import type { LatLng } from "./geometry";

/**
 * A rectangle on the map, in degrees. Longitudes stay within -180..180; `west` greater than
 * `east` means the rectangle crosses the antimeridian.
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
  /** Google's scale: the world is 256 px wide at zoom 0; adapters convert (MapLibre: −1). */
  readonly zoom: number;
  readonly bounds: Bounds;
}

/** What the map should show. Zooms as in `Viewport`. */
export type View =
  | { readonly kind: "fit-all"; readonly padding: number }
  | { readonly kind: "bounds"; readonly bounds: Bounds; readonly padding: number }
  | { readonly kind: "center"; readonly center: LatLng; readonly zoom: number }
  /** Bring one location into view, as `select` does; `zoom` undefined keeps the zoom. */
  | { readonly kind: "location"; readonly id: string; readonly zoom: number | undefined };

/**
 * What adapters receive: the store resolves `fit-all` to `bounds` in one pass, taking the
 * narrower of the boxes with and without crossing the antimeridian.
 */
export type ResolvedView = Exclude<View, { readonly kind: "fit-all" }>;

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
  /**
   * Web convention (Google's): the world is 256 px wide at zoom 0. Providers with 512 px tiles
   * (MapLibre) convert, so the same number means the same scale everywhere.
   */
  readonly zoom: number;
  readonly bounds: Bounds;
}

/** What the map should show; adapters turn intents into camera moves. Zooms as in `Viewport`. */
export type View =
  /** The smallest box around all locations, crossing the antimeridian when that is shorter. */
  | { readonly kind: "fit-all"; readonly padding: number }
  | { readonly kind: "center"; readonly center: LatLng; readonly zoom: number }
  /** Bring one location into view, as `select` does; `zoom` undefined keeps the zoom. */
  | { readonly kind: "location"; readonly id: string; readonly zoom: number | undefined };

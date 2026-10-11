import type { LatLng } from "./geometry";

/** A rectangle on the map, in degrees. */
export interface Bounds {
  readonly south: number;
  readonly west: number;
  readonly north: number;
  readonly east: number;
}

/** The visible area, as the provider reports it. */
export interface Viewport {
  readonly center: LatLng;
  readonly zoom: number;
  readonly bounds: Bounds;
}

/** What the map should show; adapters turn intents into camera moves. */
export type View =
  | { readonly kind: "fit-all"; readonly padding: number }
  | { readonly kind: "center"; readonly center: LatLng; readonly zoom: number }
  /** Bring one location into view, as `select` does; `zoom` undefined keeps the zoom. */
  | { readonly kind: "location"; readonly id: string; readonly zoom: number | undefined };

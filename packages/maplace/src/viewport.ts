import type { LatLng } from "./location";

/** The visible area, as the provider reports it. */
export interface Viewport {
  readonly center: LatLng;
  readonly zoom: number;
  readonly bounds: {
    readonly south: number;
    readonly west: number;
    readonly north: number;
    readonly east: number;
  };
}

/** What the map should show; adapters turn intents into camera moves. */
export type View =
  | { readonly kind: "fit-all"; readonly padding: number }
  | { readonly kind: "center"; readonly center: LatLng; readonly zoom: number };

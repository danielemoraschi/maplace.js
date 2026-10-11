/// <reference types="google.maps" />
import type { Adapter } from "../adapter";

/** Google Maps adapter options. Only this entry knows about `google.maps`. */
export interface GoogleAdapterOptions {
  /** Required for Advanced Markers; `DEMO_MAP_ID` works for development. Styling lives in Cloud Console. */
  readonly mapId: string;
  readonly colorScheme?: "light" | "dark" | "follow-system";
  /** Draw on an existing map instead of creating one. */
  readonly map?: google.maps.Map;
  /** Extra options for a map maplace creates; ignored when `map` is given. */
  readonly mapOptions?: Omit<google.maps.MapOptions, "mapId" | "colorScheme">;
}

/**
 * Capabilities: route, cluster (loads `@googlemaps/markerclusterer` on demand), circle, edit.
 * Expects Maps JS to be loaded (bootstrap or js-api-loader); calls `google.maps.importLibrary`.
 */
export declare function createGoogleAdapter(options: GoogleAdapterOptions): Adapter;

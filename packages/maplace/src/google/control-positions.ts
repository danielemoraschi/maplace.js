/// <reference types="google.maps" preserve="true" />
import type { ControlPosition } from "../adapter";

/**
 * Maplace's corners in Google's names. Maplace's corners are physical, as the page sees the map,
 * so they map to Google's legacy corners rather than its logical ones, which flip with the
 * writing direction (Maps JS 3.66 places these with no warning). Top-left is `LEFT_TOP`, under
 * Google's own top-left controls (the Map/Satellite toggle), as Google's `TOP_LEFT` lays them out
 * in a row and a list there sits beside the toggle. Bottom-left is `LEFT_BOTTOM`, above the logo,
 * in the corner as on MapLibre: Google's `BOTTOM_LEFT` sits in the bottom row beside the logo, where
 * the terms reach under a panel on a narrow map (G21). Bottom-right keeps `BOTTOM_RIGHT`, beside the
 * terms.
 */
const GOOGLE_CORNERS = {
  "top-left": "LEFT_TOP",
  "top-right": "TOP_RIGHT",
  "bottom-left": "LEFT_BOTTOM",
  "bottom-right": "BOTTOM_RIGHT",
} as const satisfies Record<ControlPosition, keyof typeof google.maps.ControlPosition>;

/** Google's corner for one of maplace's, from the core library Maps JS loaded. */
export function googlePosition(
  core: google.maps.CoreLibrary,
  position: ControlPosition,
): google.maps.ControlPosition {
  return core.ControlPosition[GOOGLE_CORNERS[position]];
}

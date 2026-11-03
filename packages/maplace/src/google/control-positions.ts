/// <reference types="google.maps" preserve="true" />
import type { ControlPosition } from "../adapter";

/**
 * Maplace's corners in Google's names. Maplace's corners are physical, as the page sees the map,
 * so they map to Google's legacy corners rather than its logical ones, which flip with the
 * writing direction (Maps JS 3.66 places these with no warning). Top-left is `LEFT_TOP`, under
 * Google's own top-left controls (the Map/Satellite toggle), as Google's `TOP_LEFT` lays them out
 * in a row and a list there sits beside the toggle. The bottom corners keep Google's names: its
 * `BOTTOM_LEFT` and `BOTTOM_RIGHT` sit in the bottom row beside the logo and the terms, where its
 * `LEFT_BOTTOM` and `RIGHT_BOTTOM` would stack above them and take more height.
 */
const GOOGLE_CORNERS = {
  "top-left": "LEFT_TOP",
  "top-right": "TOP_RIGHT",
  "bottom-left": "BOTTOM_LEFT",
  "bottom-right": "BOTTOM_RIGHT",
} as const satisfies Record<ControlPosition, keyof typeof google.maps.ControlPosition>;

/** Google's corner for one of maplace's, from the core library Maps JS loaded. */
export function googlePosition(
  core: google.maps.CoreLibrary,
  position: ControlPosition,
): google.maps.ControlPosition {
  return core.ControlPosition[GOOGLE_CORNERS[position]];
}

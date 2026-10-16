/// <reference types="google.maps" preserve="true" />
import type { ControlPosition } from "../adapter";

/**
 * Maplace's corners in Google's names. Maplace's corners are physical, as the page sees the map,
 * so they map to Google's legacy corners rather than its logical ones, which flip with the
 * writing direction (Maps JS 3.66 places these with no warning).
 */
const GOOGLE_CORNERS = {
  "top-left": "TOP_LEFT",
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

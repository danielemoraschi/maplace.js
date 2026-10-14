import type { MapProbe } from "../../testing/map-probe";

/**
 * Sees and drives a Google adapter's map. Nothing is drawn or reported yet (G1), so it finds
 * nothing and its actions have nothing to drive; G2 gives it the map state it reads, and each row
 * teaches it what that row draws.
 */
export function createGoogleProbe(): MapProbe {
  return {
    location: () => undefined,
    locationIds: () => [],
    stackOrder: () => [],
    shownPopup: () => undefined,
    click: () => {},
    clickMap: () => {},
    pointerOver: () => {},
    pointerOut: () => {},
    drag: () => {},
    closePopup: () => {},
    settle: () => Promise.resolve(),
  };
}

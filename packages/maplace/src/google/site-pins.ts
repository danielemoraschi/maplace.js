/// <reference types="google.maps" preserve="true" />

import { type PinColours, type PinPalette, pinColoursIn } from "../adapter-kit/pin-palette";
import type { LocationState } from "../location";
import type { GoogleLibraries } from "./libraries";

/** How a map's default markers draw their pins, in the page's palette. */
export interface SitePins {
  /**
   * Whether a default marker shows maplace's pin in `state`: always while selected, at rest only
   * on a page that colours pins; otherwise it shows Google's own.
   */
  showsPin(state: LocationState): boolean;
  /** `pin` in `state`'s colours, a new one when none is given: each marker keeps its own. */
  paint(state: LocationState, pin?: HTMLElement): HTMLElement;
}

/** A map's default pins in `palette`. */
export function createSitePins(libraries: GoogleLibraries, palette: PinPalette): SitePins {
  const coloursResting = Object.values(palette.resting).some(Boolean);
  return {
    showsPin: (state) => state.selected || coloursResting,
    paint: (state, pin = new libraries.marker.PinElement()) =>
      Object.assign(pin, pinOptionsOf(pinColoursIn(palette, state))),
  };
}

/** A pin's colours as Google's options name them: null keeps Google's own colour. */
function pinOptionsOf({ background, border, glyph }: PinColours) {
  return { background: background ?? null, borderColor: border ?? null, glyphColor: glyph ?? null };
}

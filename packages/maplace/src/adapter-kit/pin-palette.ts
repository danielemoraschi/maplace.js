import type { LocationState } from "../location";

/** A default pin's colours; one left undefined is the provider's own. */
export interface PinColours {
  readonly background: string | undefined;
  readonly border: string | undefined;
  readonly glyph: string | undefined;
}

/** A default pin's colours at rest and while selected. */
export interface PinPalette {
  readonly resting: PinColours;
  readonly selected: PinColours;
}

/** The dot of a selected pin, darker than the resting pin's, unless the page sets its own. */
export const SELECTED_PIN_GLYPH = "#980400";

/**
 * The default pins' colours from the page's `--maplace-pin-*` properties on `element` or above it,
 * read once: a value that isn't a colour is left out, so the provider's own stays. The selected
 * pin is the resting one with its dot darker.
 */
export function pinPaletteOf(element: Element): PinPalette {
  const colourOf = colourReader(element);
  const resting = {
    background: colourOf("--maplace-pin-background"),
    border: colourOf("--maplace-pin-border"),
    glyph: colourOf("--maplace-pin-glyph"),
  };
  const glyph = colourOf("--maplace-pin-selected-glyph") ?? SELECTED_PIN_GLYPH;
  return { resting, selected: { ...resting, glyph } };
}

/** The colours a pin is drawn in for `state`: the selected ones only while selected. */
export function pinColoursIn(palette: PinPalette, state: LocationState): PinColours {
  return state.selected ? palette.selected : palette.resting;
}

/**
 * Reads a colour property off `element`'s computed style; none in a document with no window.
 * `currentColor` is the map's text colour, resolved here: a canvas would resolve it against itself.
 */
function colourReader(element: Element): (property: string) => string | undefined {
  const view = element.ownerDocument.defaultView;
  if (view === null) return () => undefined;
  const style = view.getComputedStyle(element);
  return (property) => {
    const value = style.getPropertyValue(property).trim();
    if (value.toLowerCase() === "currentcolor") return style.color;
    return value !== "" && view.CSS.supports("color", value) ? value : undefined;
  };
}

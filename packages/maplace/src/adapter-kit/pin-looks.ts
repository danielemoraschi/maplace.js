import type { LocationState } from "../location";

/**
 * How a default pin is drawn: its dot, the ring round it, whether a halo of the dot's colour goes
 * round that (selected), and its size against the resting pin's.
 */
export interface PinLook {
  readonly background: string;
  readonly border: string;
  readonly halo: boolean;
  readonly scale: number;
}

/** A default pin's look in each state. */
export interface PinLooks {
  readonly resting: PinLook;
  readonly hovered: PinLook;
  readonly selected: PinLook;
}

/** The default pin's dot and the ring round it, unless the page sets its own. */
export const PIN_BACKGROUND = "#e33b2d";
export const PIN_BORDER = "#fff";

const HOVERED_SCALE = 1.15;
const SELECTED_SCALE = 1.2;

/**
 * The default pins' looks, in the colours of the page's `--maplace-pin-*` properties on `element`
 * or above it, read once: a value that isn't a colour is left out, so the default stays. A hovered
 * pin is larger; a selected one larger still, in a halo of its dot's colour.
 */
export function pinLooksOf(element: Element): PinLooks {
  const colourOf = colourReader(element);
  const background = colourOf("--maplace-pin-background") ?? PIN_BACKGROUND;
  const border = colourOf("--maplace-pin-border") ?? PIN_BORDER;
  const resting = { background, border, halo: false, scale: 1 };
  return {
    resting,
    hovered: { ...resting, scale: HOVERED_SCALE },
    selected: { ...resting, halo: true, scale: SELECTED_SCALE },
  };
}

/** The look a pin is drawn in for `state`: selected over hovered. */
export function pinLookIn(looks: PinLooks, state: LocationState): PinLook {
  if (state.selected) return looks.selected;
  return state.hovered ? looks.hovered : looks.resting;
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

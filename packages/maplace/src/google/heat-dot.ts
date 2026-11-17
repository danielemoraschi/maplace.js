import {
  DOT_STROKE,
  dotColorAt,
  dotRadiusAt,
  relativeHeat,
  trackHeaviestHeat,
} from "../adapter-kit/heat-look";
import type { PlacedLocation } from "./placed-location";

/** On the map's container while the heat hides the dots: below the fade's first zoom. */
export const UNDER_HEAT_ATTRIBUTE = "data-maplace-under-heat";
/** On the map's container: the dots' opacity at the zoom shown, through the fade. */
export const DOTS_OPACITY = "--maplace-heat-dots";

const DOT_CLASS = "maplace-heat-dot";

/**
 * A heat marker's dot, centred on its point (an advanced marker's content stands on it), faded
 * with the heat's crossfade. Alone, it is the marker's content, its size the marker's, moved down
 * by its radius; under a pin, it is out of the marker's layout, so the pin keeps its tip there.
 * Below the fade, a marker showing its dot alone (not one in front, with its pin) is hidden: the
 * heat shows it.
 */
export const HEAT_DOT_STYLES =
  `[${UNDER_HEAT_ATTRIBUTE}] :has(> .${DOT_CLASS}:only-child){display:none!important}` +
  `.${DOT_CLASS}{display:block;transform:translateY(50%);` +
  `box-sizing:border-box;border-radius:50%;` +
  `border:${DOT_STROKE.width}px solid ${DOT_STROKE.color};opacity:var(${DOTS_OPACITY},1)}` +
  `.${DOT_CLASS}:not(:only-child){position:absolute;left:50%;bottom:0;transform:translate(-50%,50%)}`;

/** A map's heat markers' dots, each weighed against the heaviest heat marker. */
export interface HeatDots {
  /** The heaviest heat marker's weight, as the dots were last weighed against. */
  heaviest(): number;
  /** Shows `marker` as a heat marker weighing `weight`, `pin` over its dot while in front. */
  show(marker: HTMLElement, weight: number, pin: HTMLElement | undefined): void;
  /** After a diff: every dot weighed again, if the heaviest heat marker's weight changed. */
  reweigh(placed: ReadonlyMap<string, PlacedLocation>): void;
}

export function createHeatDots(): HeatDots {
  const heaviestHeat = trackHeaviestHeat();
  return {
    heaviest: heaviestHeat.value,
    show: (marker, weight, pin) =>
      showHeatMarker(marker, relativeHeat(weight, heaviestHeat.value()), pin),
    reweigh(placed) {
      if (!heaviestHeat.update(placed.values())) return;
      const heaviest = heaviestHeat.value();
      for (const location of placed.values()) {
        const { heatWeight } = location.drawable();
        if ("marker" in location && heatWeight !== undefined) {
          reweighHeatDot(location.marker, relativeHeat(heatWeight, heaviest));
        }
      }
    },
  };
}

/**
 * Shows `marker` as a heat marker: its dot, sized and coloured by its weight against the
 * heaviest, with `pin` over it while it is in front (selected or hovered), so it shows over the
 * heat at any zoom and a pointer on the dot stays on the marker.
 */
function showHeatMarker(marker: HTMLElement, relative: number, pin: HTMLElement | undefined): void {
  const dot = dotIn(marker) ?? newDot(marker.ownerDocument);
  styleDot(dot, relative);
  // The dot stays where it is as the pin comes and goes: taken out from under the pointer, it
  // would make the browser work out what is hovered again.
  if (dot.parentNode !== marker) marker.replaceChildren(dot);
  for (const child of marker.querySelectorAll(":scope > *")) {
    if (child !== dot && child !== pin) child.remove();
  }
  if (pin !== undefined && pin.nextSibling !== dot) dot.before(pin);
}

/** A heat marker's dot sized and coloured again, for a new heaviest weight. */
function reweighHeatDot(marker: HTMLElement, relative: number): void {
  const dot = dotIn(marker);
  if (dot !== undefined) styleDot(dot, relative);
}

function newDot(document: Document): HTMLElement {
  const dot = document.createElement("span");
  dot.className = DOT_CLASS;
  return dot;
}

function styleDot(dot: HTMLElement, relative: number): void {
  const diameter = `${2 * dotRadiusAt(relative)}px`;
  dot.style.width = diameter;
  dot.style.height = diameter;
  dot.style.background = dotColorAt(relative);
}

function dotIn(marker: HTMLElement): HTMLElement | undefined {
  return marker.querySelector<HTMLElement>(`:scope > .${DOT_CLASS}`) ?? undefined;
}

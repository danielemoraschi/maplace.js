import { adoptStyles } from "../adopted-styles";
import type { LatLng } from "../geometry";
import { outsideUnstyled } from "../unstyled";

/** The class of the dot a map draws at the store's origin. */
export const ORIGIN_DOT_CLASS = "maplace-origin-dot";

/** The dot's look, off inside the opt-out; it takes no input anywhere, so a click reaches the map. */
const ORIGIN_DOT_STYLES = `:where(.${ORIGIN_DOT_CLASS}){pointer-events:none}
${outsideUnstyled(`.${ORIGIN_DOT_CLASS}`)}{box-sizing:border-box;width:18px;height:18px;border:3px solid #fff;border-radius:50%;background:#1a73e8;box-shadow:0 0 2px 1px #0006}`;

/** The dot's element in `document`, its styles adopted there. */
export function originDotElement(document: Document): HTMLElement {
  adoptStyles(document, ORIGIN_DOT_STYLES);
  const dot = document.createElement("div");
  dot.className = ORIGIN_DOT_CLASS;
  return dot;
}

/** A dot a provider has placed. */
export interface DrawnDot {
  moveTo(at: LatLng): void;
  remove(): void;
}

/** How one adapter reads its state and places a marker; the rest of the dot's life is here. */
export interface OriginDotSources<Mounted> {
  mounted(): Mounted | undefined;
  origin(): LatLng | undefined;
  place(mounted: Mounted, at: LatLng): DrawnDot;
}

/** The dot at the store's origin: a part of the map, shown or moved as each `present` says. */
export interface OriginDot<Mounted> {
  readonly part: { open(mounted: Mounted): void };
  sync(): void;
}

export function createOriginDot<Mounted extends { onDestroy(teardown: () => void): void }>({
  mounted,
  origin,
  place,
}: OriginDotSources<Mounted>): OriginDot<Mounted> {
  let drawn: DrawnDot | undefined;
  let drawnAt: LatLng | undefined;

  function take(): void {
    drawn?.remove();
    drawn = undefined;
  }

  function sync(): void {
    const map = mounted();
    if (map === undefined) return;
    const at = origin();
    if (at === undefined) take();
    else if (drawn === undefined) drawn = place(map, at);
    // Every `present` comes here, a hover's too: only a new origin moves it.
    else if (at !== drawnAt) drawn.moveTo(at);
    drawnAt = at;
  }

  return {
    sync,
    part: {
      open(map) {
        sync();
        map.onDestroy(take);
      },
    },
  };
}

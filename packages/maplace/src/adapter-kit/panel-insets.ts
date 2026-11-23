import { CONTROL_CLASS } from "./control-styles";
import type { Box } from "./popup-shift";
import type { MapSize } from "./web-mercator";

/** How far in from each of the map's edges something covers it, in px: what a fit keeps clear of. */
export interface Insets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export const NO_INSETS: Insets = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });

type Side = keyof Insets;

/**
 * The insets maplace's panels on the map (`.maplace-control`) cover, each panel counted on the one
 * edge where keeping clear of it costs the map less: a wide, short select in a top corner on the
 * top, a tall, narrow list on its side. A side keeps the deepest panel on it.
 */
export function measurePanelInsets(container: HTMLElement): Insets {
  return panelInsets(container.getBoundingClientRect(), panelBoxesIn(container));
}

function panelBoxesIn(container: HTMLElement): DOMRect[] {
  return [...container.querySelectorAll(`.${CONTROL_CLASS}`)].map((panel) =>
    panel.getBoundingClientRect(),
  );
}

/** The insets `panels` cover on `map`, as `measurePanelInsets` counts them. */
export function panelInsets(map: Box, panels: readonly Box[]): Insets {
  const width = map.right - map.left;
  const height = map.bottom - map.top;
  if (width <= 0 || height <= 0) return NO_INSETS;
  const insets: Record<Side, number> = { top: 0, right: 0, bottom: 0, left: 0 };
  for (const panel of panels.filter((each) => meets(each, map))) {
    const vertical = verticalReach(panel, map);
    const horizontal = horizontalReach(panel, map);
    const [side, reach] =
      vertical.reach / height <= horizontal.reach / width
        ? [vertical.side, vertical.reach]
        : [horizontal.side, horizontal.reach];
    insets[side] = Math.max(insets[side], Math.ceil(reach));
  }
  return insets;
}

/**
 * `insets` where they leave a fit with `padding` at least a quarter of the map on each axis (a phone
 * map with a select above and the attribution below keeps both); an axis they
 * would crowd more keeps only the padding, so a large panel never shrinks a fit to nothing.
 */
export function insetsLeavingRoom(insets: Insets, size: MapSize, padding: number): Insets {
  const roomy = (extent: number, a: number, b: number) =>
    extent - a - b - 2 * padding >= extent / 4;
  const across = roomy(size.width, insets.left, insets.right);
  const down = roomy(size.height, insets.top, insets.bottom);
  return {
    top: down ? insets.top : 0,
    right: across ? insets.right : 0,
    bottom: down ? insets.bottom : 0,
    left: across ? insets.left : 0,
  };
}

/** Whether a maplace panel under `container` now reaches into the map inside `insets`. */
export function panelsReachInto(container: HTMLElement, insets: Insets): boolean {
  return reachesInto(container.getBoundingClientRect(), panelBoxesIn(container), insets);
}

/** Whether any of `panels` reaches into `map` inside `insets`: where a fit kept clear of them. */
export function reachesInto(map: Box, panels: readonly Box[], insets: Insets): boolean {
  const clear = {
    left: map.left + insets.left,
    top: map.top + insets.top,
    right: map.right - insets.right,
    bottom: map.bottom - insets.bottom,
  };
  return panels.some((panel) => meets(panel, clear));
}

export function sameInsets(a: Insets, b: Insets): boolean {
  return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
}

/** `insets` with `padding` more on every side: a fit's padding, kept clear of them. */
export function paddedBy(insets: Insets, padding: number): Insets {
  return {
    top: insets.top + padding,
    right: insets.right + padding,
    bottom: insets.bottom + padding,
    left: insets.left + padding,
  };
}

/** `size` less what `insets` cover. */
export function sizeClearOf(size: MapSize, insets: Insets): MapSize {
  return {
    width: Math.max(0, size.width - insets.left - insets.right),
    height: Math.max(0, size.height - insets.top - insets.bottom),
  };
}

/** Each side the deeper of `a`'s and `b`'s. */
export function deeperInsets(a: Insets, b: Insets): Insets {
  return {
    top: Math.max(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
    left: Math.max(a.left, b.left),
  };
}

function meets(panel: Box, map: Box): boolean {
  return (
    panel.right > panel.left &&
    panel.bottom > panel.top &&
    panel.right > map.left &&
    panel.left < map.right &&
    panel.bottom > map.top &&
    panel.top < map.bottom
  );
}

/** How far down from the top, or up from the bottom, `panel` reaches: from the nearer edge. */
function verticalReach(panel: Box, map: Box): { side: Side; reach: number } {
  const height = map.bottom - map.top;
  const inTopHalf = (panel.top + panel.bottom) / 2 < map.top + height / 2;
  const reach = inTopHalf ? panel.bottom - map.top : map.bottom - panel.top;
  return { side: inTopHalf ? "top" : "bottom", reach: clamp(reach, height) };
}

/** How far in from the left, or from the right, `panel` reaches: from the nearer edge. */
function horizontalReach(panel: Box, map: Box): { side: Side; reach: number } {
  const width = map.right - map.left;
  const inLeftHalf = (panel.left + panel.right) / 2 < map.left + width / 2;
  const reach = inLeftHalf ? panel.right - map.left : map.right - panel.left;
  return { side: inLeftHalf ? "left" : "right", reach: clamp(reach, width) };
}

function clamp(reach: number, extent: number): number {
  return Math.min(Math.max(reach, 0), extent);
}

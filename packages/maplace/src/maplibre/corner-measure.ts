import { CONTROL_POSITIONS, type ControlPosition } from "../adapter";
import { MAPLACE_LISTS } from "../adapter-kit/control-styles";
import { OUTSIDE_UNSTYLED } from "../unstyled";
import { PANEL_SELECTOR } from "./control-styles";
import type { CornerContent, CornersOnMap, Held, Span } from "./corner-layout";

/** MapLibre's four corner elements on a map, by maplace's names for them (MapLibre's own). */
export type CornerElements = Readonly<Record<ControlPosition, HTMLElement>>;

/** The corners MapLibre made for the map in `container`; undefined where any is missing. */
export function cornerElementsIn(container: HTMLElement): CornerElements | undefined {
  const corners: Partial<Record<ControlPosition, HTMLElement>> = {};
  for (const position of Object.keys(CONTROL_POSITIONS) as ControlPosition[]) {
    const corner = container.querySelector<HTMLElement>(
      `:scope>.maplibregl-control-container>.maplibregl-ctrl-${position}`,
    );
    if (corner === null) return undefined;
    corners[position] = corner;
  }
  return corners as CornerElements;
}

/**
 * The map's height inside its border, where MapLibre's corners sit, and what each corner holds, as
 * laid out now.
 */
export function measureCorners(container: HTMLElement, corners: CornerElements): CornersOnMap {
  const mapBox = container.getBoundingClientRect();
  const contentOf = (corner: HTMLElement) => cornerContentOf(corner, mapBox);
  return {
    height: container.clientHeight,
    corners: {
      "top-left": contentOf(corners["top-left"]),
      "top-right": contentOf(corners["top-right"]),
      "bottom-left": contentOf(corners["bottom-left"]),
      "bottom-right": contentOf(corners["bottom-right"]),
    },
  };
}

function cornerContentOf(corner: HTMLElement, mapBox: DOMRect): CornerContent {
  const box = corner.getBoundingClientRect();
  const shown = Array.from(corner.children).filter(isShown);
  const lists = outermostLists(corner);
  return {
    ...spanOf(box, mapBox),
    fixedHeight: box.height - lists.reduce((sum, list) => sum + list.offsetHeight, 0),
    held: shown.map((element) => heldIn(element, box, mapBox)),
    holdsPanel: shown.some((element) => element.matches(PANEL_SELECTOR)),
    naturalListHeights: lists.map(naturalHeightOf),
  };
}

function heldIn(element: Element, cornerBox: DOMRect, mapBox: DOMRect): Held {
  const box = element.getBoundingClientRect();
  return { ...spanOf(box, mapBox), rise: cornerBox.bottom - box.top };
}

/** Where `box` spans across the map. */
function spanOf(box: DOMRect, mapBox: DOMRect): Span {
  return { left: box.left - mapBox.left, right: box.right - mapBox.left };
}

/**
 * The shown maplace lists in `corner`'s maplace panels, outside the opt-out, which their room
 * limits, not inside another, so a headed list counts once.
 */
function outermostLists(corner: HTMLElement): HTMLElement[] {
  const lists = corner.querySelectorAll<HTMLElement>(
    `${PANEL_SELECTOR} ${MAPLACE_LISTS}${OUTSIDE_UNSTYLED}`,
  );
  return Array.from(lists).filter(
    (list) => isShown(list) && !list.parentElement?.closest(MAPLACE_LISTS),
  );
}

/** A list's height with no limit: its height now and what it, and lists inside it, scroll. */
function naturalHeightOf(list: HTMLElement): number {
  const scrolled = [list, ...list.querySelectorAll<HTMLElement>(MAPLACE_LISTS)].reduce(
    (sum, each) => sum + each.scrollHeight - each.clientHeight,
    0,
  );
  return list.offsetHeight + scrolled;
}

function isShown(element: Element): boolean {
  return element.getClientRects().length > 0;
}

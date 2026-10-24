/// <reference types="google.maps" preserve="true" />
import { hasSize } from "../adapter-kit/map-size";
import type { Box } from "../adapter-kit/popup-shift";

/** Where a popup may go on a map, and the controls it must stay clear of. */
export interface CornerLayout {
  /** Google's root: the map as drawn, inside any border the page gives the map's element. */
  readonly room: Box;
  readonly controls: readonly Box[];
}

/** Shown, as a person sees it: not see-through, not hidden. */
const SHOWN = { opacityProperty: true, visibilityProperty: true };

/**
 * The room on `map` and what it shows over its panes, none of which a popup may cover: the
 * controls pushed to its corners (maplace's panels, a page's) and Google's own, its buttons, its
 * logo and its terms (Google's terms ask that its branding stay in view). Google's own have no API,
 * and its class names aren't one, so they are found by structure. Google's root is the child of the
 * map's element holding `popup` (a page's own map may hold the page's nodes too); in the layer it
 * draws in, each element shown with a box is one, except what holds `popup` (the panes). What
 * isn't shown (Google's see-through layers) is left out whole; a container with no box, or a layer
 * over the whole room, is looked inside. A control not drawn yet is off the page, so not shown.
 */
export function measureCorners(map: google.maps.Map, popup: Element): CornerLayout {
  const div = map.getDiv();
  const root = [...div.children].find((child) => child.contains(popup)) ?? div;
  const room = root.getBoundingClientRect();
  const pushed = map.controls.flatMap((corner) => corner.getArray());
  const outermostShown = (elements: Iterable<Element>): Box[] =>
    Array.from(elements).flatMap((element) => {
      if (element.contains(popup) || !element.checkVisibility(SHOWN)) return [];
      const box = element.getBoundingClientRect();
      return hasSize(box) && !covers(box, room) ? [box] : outermostShown(element.children);
    });
  return { room, controls: outermostShown([...pushed, ...layerIn(root).children]) };
}

/** The layer Google draws everything in (`gm-style`), inside `root`'s one-child wrappers. */
function layerIn(root: Element): Element {
  let layer = root;
  while (layer.childElementCount === 1) layer = layer.firstElementChild as Element;
  return layer;
}

/** Less than a pixel: how far inside the room a layer over it may be laid out, as layout rounds. */
const SUBPIXEL = 0.5;

function covers(box: Box, room: Box): boolean {
  return (
    box.left <= room.left + SUBPIXEL &&
    box.top <= room.top + SUBPIXEL &&
    box.right >= room.right - SUBPIXEL &&
    box.bottom >= room.bottom - SUBPIXEL
  );
}

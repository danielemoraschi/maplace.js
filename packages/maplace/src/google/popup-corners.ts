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

/** Less than a pixel: how far apart two edges laid out alike may be, as layout rounds. */
const SUBPIXEL = 0.5;

/**
 * The room on `map` and what it shows over its panes, none of which a popup may cover: the
 * controls pushed to its corners (maplace's panels, a page's) and Google's own, its buttons, its
 * logo and its terms (Google's terms ask that its branding stay in view). Google's own have no API,
 * and its class names aren't one, so they are found by structure. Google's root is the child of the
 * map's element holding `popup` (a page's own map may hold the page's nodes too); in the layer it
 * draws in, each element shown with a box is one, except the panes: the container holding `popup`
 * and any laid out where it is, with the markers they hold. What isn't shown (Google's see-through
 * layers) is left out whole; a container with no box, or a layer over the whole room (the map's
 * region holding the panes among them), is looked inside. A control not drawn yet is off the page,
 * so not shown.
 */
export function measureCorners(map: google.maps.Map, popup: Element): CornerLayout {
  const div = map.getDiv();
  const root = [...div.children].find((child) => child.contains(popup)) ?? div;
  const room = root.getBoundingClientRect();
  const layer = layerIn(root);
  const paneBox = paneBoxOf(popup, layer, room);
  const pushed = map.controls.flatMap((corner) => corner.getArray());
  const outermostShown = (elements: Iterable<Element>): Box[] =>
    Array.from(elements).flatMap((element) => {
      if (element === popup || !element.checkVisibility(SHOWN)) return [];
      const box = element.getBoundingClientRect();
      if (covers(box, room)) return outermostShown(element.children);
      if (element.contains(popup) || (paneBox && sameBox(box, paneBox))) return [];
      return hasSize(box) ? [box] : outermostShown(element.children);
    });
  return { room, controls: outermostShown([...pushed, ...layer.children]) };
}

/**
 * The box of the container of panes holding `popup`: its outermost ancestor in `layer` that isn't
 * over the whole room. Google lays its other pane containers out at the same place.
 */
function paneBoxOf(popup: Element, layer: Element, room: Box): Box | undefined {
  let panes = popup;
  for (let up = popup.parentElement; up !== layer; up = up.parentElement) {
    if (up === null) return undefined;
    if (!covers(up.getBoundingClientRect(), room)) panes = up;
  }
  return panes.getBoundingClientRect();
}

function sameBox(a: Box, b: Box): boolean {
  return (
    near(a.left, b.left) && near(a.top, b.top) && near(a.right, b.right) && near(a.bottom, b.bottom)
  );
}

function near(a: number, b: number): boolean {
  return Math.abs(a - b) < SUBPIXEL;
}

/** The layer Google draws everything in (`gm-style`), inside `root`'s one-child wrappers. */
function layerIn(root: Element): Element {
  let layer = root;
  while (layer.childElementCount === 1) layer = layer.firstElementChild as Element;
  return layer;
}

function covers(box: Box, room: Box): boolean {
  return (
    box.left <= room.left + SUBPIXEL &&
    box.top <= room.top + SUBPIXEL &&
    box.right >= room.right - SUBPIXEL &&
    box.bottom >= room.bottom - SUBPIXEL
  );
}

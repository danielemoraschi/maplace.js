import { frozenBounds, frozenPoint } from "../diff/frozen";
import { sameFields } from "../diff/same";
import type { Snapshot } from "../store";
import { child, root } from "../validate/fail";
import { checkLatLng } from "../validate/geometry";
import { checkBounds, checkZoom } from "../validate/viewport";
import type { Viewport } from "../viewport";
import { type Change, NO_CHANGE } from "./change";

const VIEWPORT = child(root("reportViewportChange"), "viewport");

/**
 * The visible area settled after a move: stored as a frozen copy, then `viewportChange` fires.
 * One no map can show is the adapter's bug and throws.
 */
export function setViewport<Data>(snapshot: Snapshot<Data>, viewport: Viewport): Change<Data> {
  checkViewport(viewport);
  const current = snapshot.viewport;
  if (current !== undefined && sameViewport(current, viewport)) return NO_CHANGE;
  const copy = frozenViewport(viewport);
  return {
    patch: { viewport: copy },
    events: [{ name: "viewportChange", payload: { viewport: copy } }],
  };
}

function checkViewport({ center, zoom, bounds }: Viewport): void {
  checkLatLng(center, child(VIEWPORT, "center"));
  checkZoom(zoom, child(VIEWPORT, "zoom"));
  checkBounds(bounds, child(VIEWPORT, "bounds"));
}

/** `sameFields` is shallow, and a viewport nests its centre and bounds. */
function sameViewport(a: Viewport, b: Viewport): boolean {
  return a.zoom === b.zoom && sameFields(a.center, b.center) && sameFields(a.bounds, b.bounds);
}

function frozenViewport({ center, zoom, bounds }: Viewport): Viewport {
  return Object.freeze({ center: frozenPoint(center), zoom, bounds: frozenBounds(bounds) });
}

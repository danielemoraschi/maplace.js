import { frozenBounds, frozenPoint } from "../diff/frozen";
import type { LatLng } from "../geometry";
import { child, root } from "../validate/fail";
import { checkLatLng } from "../validate/geometry";
import { checkBounds, checkFitOptions, checkZoom } from "../validate/viewport";
import type { Bounds, FitOptions, View } from "../viewport";

import { type Change, patchOnly } from "./change";

type BoundsView = Extract<View, { readonly kind: "fit-bounds" }>;

/** Pixels around fitted locations or boxes unless `padding` says otherwise (RFC §3). */
export const FIT_PADDING = 40;

// Each call makes a new view, so asking for the same view again re-applies it after the user
// moved the map. Views are frozen copies: the snapshot owns them, coordinates included, so
// neither the caller's objects nor a reader of the snapshot can change them.

export function fitAll(options?: FitOptions): Change<never> {
  checkFitOptions(options, child(root("fitAll"), "options"));
  return patchOnly({ view: fitAllView(options?.padding) });
}

export function fitBounds(bounds: Bounds, options?: FitOptions): Change<never> {
  const subject = root("fitBounds");
  checkBounds(bounds, child(subject, "bounds"));
  checkFitOptions(options, child(subject, "options"));
  return patchOnly({ view: boundsView(bounds, options?.padding) });
}

export function setView(center: LatLng, zoom: number): Change<never> {
  const subject = root("setView");
  checkLatLng(center, child(subject, "center"));
  checkZoom(zoom, child(subject, "zoom"));
  return patchOnly({ view: centerView(center, zoom) });
}

/** All locations fitted, by default with `FIT_PADDING`. */
export function fitAllView(padding = FIT_PADDING): View {
  return Object.freeze({ kind: "fit-all", padding });
}

/** One location brought into view, as selecting does; `zoom` undefined keeps the zoom. */
export function locationView(id: string, zoom: number | undefined): View {
  return Object.freeze({ kind: "location", id, zoom });
}

/** A box brought into view, by default with `FIT_PADDING`. */
export function boundsView(bounds: Bounds, padding = FIT_PADDING): BoundsView {
  return Object.freeze({ kind: "fit-bounds", bounds: frozenBounds(bounds), padding });
}

function centerView(center: LatLng, zoom: number): View {
  return Object.freeze({ kind: "center", center: frozenPoint(center), zoom });
}

/** `options.view` as the store keeps it. */
export function copyView(view: View): View {
  switch (view.kind) {
    case "fit-all":
      return fitAllView(view.padding);
    case "fit-bounds":
      return boundsView(view.bounds, view.padding);
    case "center":
      return centerView(view.center, view.zoom);
    case "location":
      return locationView(view.id, view.zoom);
  }
}

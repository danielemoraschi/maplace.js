import type { Location } from "../location";
import type { Snapshot } from "../store";
import { hasArea, isInBox, unwrapped, type ViewBox } from "../view-box";
import type { Viewport } from "../viewport";
import { type ListedTest, listedEntries } from "./model";

/**
 * What a list with `scope` lists in: every listed location until a search, then the view it was
 * last searched in.
 */
export type ListScope =
  | { readonly kind: "unscoped" }
  | { readonly kind: "scoped"; readonly to: Viewport };

export const UNSCOPED: ListScope = { kind: "unscoped" };

/**
 * The scope once the map reports `viewport`: unscoped without a laid-out one (a detach, a hidden
 * map), else the same scope. Nothing but a search scopes a list.
 */
export function scopeAfter(scope: ListScope, viewport: Viewport | undefined): ListScope {
  return isLaidOut(viewport) ? scope : UNSCOPED;
}

/** What a search in `viewport` makes: scoped to it, or unscoped when it isn't laid out. */
export function scopedTo(viewport: Viewport | undefined): ListScope {
  return isLaidOut(viewport) ? { kind: "scoped", to: viewport } : UNSCOPED;
}

/**
 * Whether the map reports a view to decide "Search this area" on again: another report, and not
 * a resize of the last one, which keeps its centre and zoom (the list's own height changing the
 * map's is one).
 */
export function isNewView(previous: Viewport | undefined, next: Viewport | undefined): boolean {
  if (next === previous) return false;
  return previous === undefined || next === undefined || !sameCamera(previous, next);
}

/**
 * Whether "Search this area" would change the list, which shows `listing`: once the map is
 * ready, for a laid-out view that lists other locations.
 */
export function offersSearch<Data>(
  snapshot: Snapshot<Data>,
  listing: readonly Location<Data>[],
): boolean {
  const { viewport } = snapshot;
  if (snapshot.loadState !== "ready" || !isLaidOut(viewport)) return false;
  return !sameLocations(listing, listedEntries(snapshot, inViewOf(scopedTo(viewport))));
}

/** What a scoped list keeps: the locations with a point in its view; nothing narrows otherwise. */
export function inViewOf(scope: ListScope): ListedTest | undefined {
  if (scope.kind === "unscoped") return undefined;
  const box = unwrapped(scope.to.bounds);
  return (location) => isLocationInBox(location, box);
}

function isLaidOut(viewport: Viewport | undefined): viewport is Viewport {
  return viewport !== undefined && hasArea(viewport.bounds);
}

function sameCamera(a: Viewport, b: Viewport): boolean {
  return a.zoom === b.zoom && a.center.lat === b.center.lat && a.center.lng === b.center.lng;
}

function sameLocations<Data>(a: readonly Location<Data>[], b: readonly Location<Data>[]): boolean {
  return a.length === b.length && a.every((location, index) => location === b[index]);
}

/** A marker by its point, a circle by its centre, a line or polygon by any point of its path. */
function isLocationInBox(location: Location, box: ViewBox): boolean {
  switch (location.type) {
    case undefined:
    case "marker":
      return isInBox(location, box);
    case "circle":
      return isInBox(location.center, box);
    case "polyline":
    case "polygon":
      return location.path.some((point) => isInBox(point, box));
  }
}

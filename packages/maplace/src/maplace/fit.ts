import type { Adapter } from "../adapter";
import { isMarker } from "../diff/geometry";
import type { Location } from "../location";
import { locationById } from "../location-index";
import { isShown, type Scope } from "../location-state";
import { runSafely } from "../state/safely";
import { boundsView, type LocationView, locationView } from "../state/views";
import type { Snapshot } from "../store";
import type { ResolvedView, View } from "../viewport";
import { boundsAround } from "./bounds";

/** Sends one adapter the views a pass asks for. */
export type ViewSender = (next: Snapshot, previous: Snapshot | undefined) => void;

/**
 * A view is sent when it changes. A fit-all with nothing shown sends nothing and waits: it fits
 * once locations are shown, so a store attached before its data arrives still fits it. The first
 * view sent is the map's opening one (`openingView`), whenever it comes.
 */
export function createViewSender(adapter: Adapter): ViewSender {
  let fitPending = false;
  let opened = false;
  return (next, previous) => {
    const shownChanged = next.locations !== previous?.locations || next.filter !== previous.filter;
    if (next.view === previous?.view && !(fitPending && shownChanged)) return;
    const resolved = resolveView(next.view, next);
    const view = opened ? resolved : openingView(resolved, next);
    fitPending = view === undefined;
    if (view === undefined) return;
    opened = true;
    runSafely(() => adapter.setView(view));
  };
}

type FitAllView = Extract<View, { readonly kind: "fit-all" }>;

/**
 * The map's first view: a marker still without a zoom (none asked, none its own) is fitted, as a
 * fit of one place is, where any later selection pans to it; a map has no zoom of its own yet.
 */
function openingView(
  view: ResolvedView | undefined,
  { locations }: Scope,
): ResolvedView | undefined {
  if (view?.kind !== "location" || view.zoom !== undefined) return view;
  const marker = locationById(locations, view.id);
  return marker === undefined ? view : locationFitted(view, marker);
}

/**
 * The view an adapter is sent, resolved once, when asked for: `fit-all` becomes a box around the
 * shown locations (undefined when nothing is shown), a location view without a zoom takes the
 * location's own, and a shape with neither a box around it.
 */
export function resolveView(view: View, scope: Scope): ResolvedView | undefined {
  switch (view.kind) {
    case "fit-all":
      return shownLocationsFitted(view, scope);
    case "location":
      return locationShown(view, scope);
    default:
      return view;
  }
}

function shownLocationsFitted({ padding }: FitAllView, scope: Scope): ResolvedView | undefined {
  const shown = scope.locations.filter((location) => isShown(location, scope.filter));
  const bounds = boundsAround(shown);
  return bounds && boundsView(bounds, padding);
}

/**
 * A location brought into view at the asked zoom, else its own; with neither, a marker keeps the
 * map's zoom and a shape is fitted.
 */
function locationShown(view: LocationView, { locations }: Scope): ResolvedView {
  const location = locationById(locations, view.id);
  if (view.zoom !== undefined || location === undefined) return view;
  if (location.zoom !== undefined) return locationView(view.id, location.zoom);
  return isMarker(location) ? view : locationFitted(view, location);
}

function locationFitted(view: LocationView, location: Location): ResolvedView {
  const bounds = boundsAround([location]);
  return bounds ? boundsView(bounds) : view;
}

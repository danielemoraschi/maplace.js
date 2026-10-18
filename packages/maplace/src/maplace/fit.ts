import type { Adapter } from "../adapter";
import { isMarker } from "../diff/geometry";
import { isShown, locationById, type Scope } from "../location-state";
import { runSafely } from "../state/safely";
import { boundsView } from "../state/views";
import type { Snapshot } from "../store";
import type { ResolvedView, View } from "../viewport";
import { boundsAround } from "./bounds";

/** Sends one adapter the views a pass asks for. */
export type ViewSender = (next: Snapshot, previous: Snapshot | undefined) => void;

/**
 * A view is sent when it changes. A fit-all with nothing shown sends nothing and waits: it fits
 * once locations are shown, so a store attached before its data arrives still fits it.
 */
export function createViewSender(adapter: Adapter): ViewSender {
  let fitPending = false;
  return (next, previous) => {
    const shownChanged = next.locations !== previous?.locations || next.filter !== previous.filter;
    if (next.view === previous?.view && !(fitPending && shownChanged)) return;
    const view = resolveView(next.view, next);
    fitPending = view === undefined;
    if (view !== undefined) runSafely(() => adapter.setView(view));
  };
}

type FitAllView = Extract<View, { readonly kind: "fit-all" }>;
type LocationView = Extract<View, { readonly kind: "location" }>;

/**
 * The view an adapter is sent, resolved once, when asked for: `fit-all` becomes a box around the
 * shown locations (undefined when nothing is shown), and a shape selected without a zoom a box
 * around it.
 */
export function resolveView(view: View, scope: Scope): ResolvedView | undefined {
  switch (view.kind) {
    case "fit-all":
      return shownLocationsFitted(view, scope);
    case "location":
      return fittedIfShape(view, scope);
    default:
      return view;
  }
}

function shownLocationsFitted({ padding }: FitAllView, scope: Scope): ResolvedView | undefined {
  const shown = scope.locations.filter((location) => isShown(location, scope.filter));
  const bounds = boundsAround(shown);
  return bounds && boundsView(bounds, padding);
}

/** A shape selected without a zoom fits; a marker, or a shape at a zoom, stays as asked. */
function fittedIfShape(view: LocationView, { locations }: Scope): ResolvedView {
  const location = locationById(locations, view.id);
  if (view.zoom !== undefined || location === undefined || isMarker(location)) return view;
  const bounds = boundsAround([location]);
  return bounds ? boundsView(bounds) : view;
}

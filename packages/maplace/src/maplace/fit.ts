import type { Adapter } from "../adapter";
import { isShown, type Scope } from "../state/lookup";
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

/**
 * The view an adapter is sent: `fit-all` becomes a box around the shown locations, resolved
 * once, when asked for; undefined when nothing is shown.
 */
export function resolveView(view: View, scope: Scope): ResolvedView | undefined {
  if (view.kind !== "fit-all") return view;
  const shown = scope.locations.filter((location) => isShown(location, scope.filter));
  const bounds = boundsAround(shown);
  return bounds && boundsView(bounds, view.padding);
}

import type { Adapter, AdapterHost, LocationDiff } from "../adapter";
import type { Drawable } from "../drawable";
import { markUsed } from "../validate/used-adapters";
import { type Asks, asksOf } from "./content-renders";
import {
  type ContentHosts,
  type ContentSlots,
  createContentSession,
  type SessionSettings,
} from "./content-slots";
import { reactDrawable, type Wrapped } from "./react-drawables";

/** An adapter that asks React for content first, and the session React renders it from. */
export interface ReactContentAdapter {
  readonly adapter: Adapter;
  readonly session: ContentSlots;
}

/**
 * `adapter`, its drawables asking React for their popup content (when `popupContent` is given)
 * and marker icon (when `markerIcon` is), falling back to their own; undefined when neither is
 * given. Each member is delegated: an adapter may be a class. A popup's `popupOpen` waits for
 * React's content (RFC §3 Events). For an adapter not attached before: the store refuses a used
 * adapter by identity, which the wrapper hides, so the one inside is marked used here.
 */
export function withReactContent<Data>(
  adapter: Adapter,
  settings: Omit<SessionSettings<Data>, "report">,
): ReactContentAdapter | undefined {
  const asks = asksOf(settings.renders.current);
  return asks && contentAdapter(adapter, settings, asks);
}

function contentAdapter<Data>(
  adapter: Adapter,
  settings: Omit<SessionSettings<Data>, "report">,
  asks: Asks,
): ReactContentAdapter {
  markUsed(adapter);
  let host: AdapterHost | undefined;
  const session = createContentSession({
    ...settings,
    report: (error) => host?.reportError(error),
  });
  const drawn = new Map<string, Wrapped>();

  // A chunk of an earlier diff may still be drawing a removed location: its builders are no
  // longer live, so they make no slot.
  function wrapDiff({ added, updated, removed }: LocationDiff): LocationDiff {
    for (const id of removed) {
      const wrapped = drawn.get(id);
      if (wrapped) wrapped.drawing.live = false;
      drawn.delete(id);
    }
    session.removed(removed);
    const wrap = (next: Drawable) => {
      const wrapped = reactDrawable(next, drawn.get(next.id), session, asks);
      drawn.set(next.id, wrapped);
      return wrapped.drawable;
    };
    return { added: added.map(wrap), updated: updated.map(wrap), removed };
  }

  const wrapper = {
    get capabilities() {
      return adapter.capabilities;
    },
    get routeStopLimit() {
      return adapter.routeStopLimit;
    },
    get pageMapElement() {
      return adapter.pageMapElement;
    },
    mount(context) {
      host = heldPopupReports(context.host, session);
      return adapter.mount({ ...context, host });
    },
    apply: (diff) => adapter.apply(wrapDiff(diff)),
    present: (state) => adapter.present(state),
    setView: (view) => adapter.setView(view),
    setRoute: (route) => adapter.setRoute(route),
    mountControl: (node, position) => adapter.mountControl(node, position),
    destroy() {
      session.end();
      adapter.destroy();
    },
  } satisfies Record<keyof Adapter, unknown> & Adapter;
  return { adapter: wrapper, session };
}

/**
 * The store's host, its popup reports joined to React's commits: an open waits for the content,
 * and a close first lets out the open it pairs with, so the store hears both, in order.
 */
function heldPopupReports(host: AdapterHost, session: ContentHosts): AdapterHost {
  // The store's own host, a plain object of closures.
  return {
    ...host,
    reportPopupOpen: (id, element) =>
      session.whenPopupShown(id, () => host.reportPopupOpen(id, element)),
    reportPopupClose(id) {
      session.popupClosed(id);
      host.reportPopupClose(id);
    },
  };
}

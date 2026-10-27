import type { Location } from "../location";
import type { Maplace, Snapshot } from "../store";
import type { AreaFilter } from "./area-filter";
import { type ListRules, listedEntries, structureOf } from "./model";
import type { ListVariant } from "./variant";
import {
  inViewOf,
  isNewView,
  type ListScope,
  offersAreaOnly,
  scopeAfter,
  scopedTo,
  UNSCOPED,
} from "./viewport-scope";

/** Who follows the store, and by which rules. */
export interface Following<Data> {
  readonly variant: ListVariant<Data>;
  readonly rules: ListRules;
  /** With `scope`: the buttons the list is filtered to the map's view from, and back. */
  readonly areaFilter?: AreaFilter | undefined;
}

/**
 * Renders now, then on every change: the structure only when locations, filter or the list's
 * scope changed, the state only when selection or hover did. With an area filter, each new view
 * (a resize is none) decides again whether "This area only" shows (`offersAreaOnly`), as does
 * "Show all". Each pass reads the snapshot as it is then, because commits made during delivery
 * are queued.
 */
export function follow<Data>(
  maplace: Maplace<Data>,
  { variant, rules, areaFilter }: Following<Data>,
): () => void {
  let shown: Snapshot<Data> | undefined;
  let scope: ListScope = UNSCOPED;
  let listing: readonly Location<Data>[] = [];
  let offered = false;
  function renderStructure(snapshot: Snapshot<Data>): void {
    listing = listedEntries(snapshot, inViewOf(scope));
    variant.renderStructure(structureOf(listing, snapshot.locations, rules));
  }
  function showAreaFilter(): void {
    const scoped = scope.kind === "scoped";
    areaFilter?.update({ moved: offered, scoped, emptyArea: scoped && listing.length === 0 });
  }
  function sync(): void {
    const snapshot = maplace.getSnapshot();
    const next = areaFilter ? scopeAfter(scope, snapshot.viewport) : scope;
    const rescoped = next !== scope;
    scope = next;
    if (rescoped || structureChanged(shown, snapshot)) renderStructure(snapshot);
    if (stateChanged(shown, snapshot)) {
      variant.renderState({ selectedId: snapshot.selectedId, hoveredId: snapshot.hoveredId });
    }
    if (areaFilter && isNewView(shown?.viewport, snapshot.viewport)) {
      offered = offersAreaOnly(snapshot, listing);
    }
    shown = snapshot;
    showAreaFilter();
  }
  /** Lists in `next` now; only an unscoped list can leave "This area only" to offer. */
  function rescope(snapshot: Snapshot<Data>, next: ListScope): void {
    scope = next;
    renderStructure(snapshot);
    offered = next.kind === "unscoped" && offersAreaOnly(snapshot, listing);
    showAreaFilter();
  }
  function filterToView(): void {
    const snapshot = maplace.getSnapshot();
    rescope(snapshot, scopedTo(snapshot.viewport));
  }
  function showEveryLocation(): void {
    rescope(maplace.getSnapshot(), UNSCOPED);
  }
  let unsubscribe: () => void;
  try {
    unsubscribe = maplace.subscribe(sync);
  } catch (error) {
    // A destroyed store: take the view down before the caller hears of it.
    variant.destroy();
    throw error;
  }
  sync();
  const listening = new AbortController();
  const { signal } = listening;
  areaFilter?.areaOnly.addEventListener("click", filterToView, { signal });
  areaFilter?.showAll.addEventListener("click", showEveryLocation, { signal });
  return () => {
    listening.abort();
    unsubscribe();
  };
}

/** Whether the list shows other entries: its locations or filter changed. */
function structureChanged(shown: Snapshot | undefined, snapshot: Snapshot): boolean {
  if (shown === undefined) return true;
  return snapshot.locations !== shown.locations || snapshot.filter !== shown.filter;
}

function stateChanged(shown: Snapshot | undefined, snapshot: Snapshot): boolean {
  if (shown === undefined) return true;
  return snapshot.selectedId !== shown.selectedId || snapshot.hoveredId !== shown.hoveredId;
}

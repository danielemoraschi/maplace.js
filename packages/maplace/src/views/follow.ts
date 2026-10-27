import type { Location } from "../location";
import type { Maplace, Snapshot } from "../store";
import type { SearchArea } from "./list-block";
import { type ListRules, listedEntries, structureOf } from "./model";
import type { ListVariant } from "./variant";
import {
  inViewOf,
  isNewView,
  type ListScope,
  offersSearch,
  scopeAfter,
  scopedTo,
  UNSCOPED,
} from "./viewport-scope";

/** Who follows the store, and by which rules. */
export interface Following<Data> {
  readonly variant: ListVariant<Data>;
  readonly rules: ListRules;
  /** With `scope`: the button the list is scoped to the map's view again from. */
  readonly searchArea?: SearchArea | undefined;
}

/**
 * Renders now, then on every change: the structure only when locations, filter or the list's
 * scope changed, the state only when selection or hover did. With a search area, each new view
 * (a resize is none) decides again whether "Search this area" shows (`offersSearch`). Each pass
 * reads the snapshot as it is then, because commits made during delivery are queued.
 */
export function follow<Data>(
  maplace: Maplace<Data>,
  { variant, rules, searchArea }: Following<Data>,
): () => void {
  let shown: Snapshot<Data> | undefined;
  let scope: ListScope = UNSCOPED;
  let listing: readonly Location<Data>[] = [];
  let offered = false;
  function renderStructure(snapshot: Snapshot<Data>): void {
    listing = listedEntries(snapshot, inViewOf(scope));
    variant.renderStructure(structureOf(listing, snapshot.locations, rules));
  }
  function showSearchArea(): void {
    const emptyArea = scope.kind === "scoped" && listing.length === 0;
    searchArea?.update({ moved: offered, emptyArea });
  }
  function sync(): void {
    const snapshot = maplace.getSnapshot();
    const next = searchArea ? scopeAfter(scope, snapshot.viewport) : scope;
    const rescoped = next !== scope;
    scope = next;
    if (rescoped || structureChanged(shown, snapshot)) renderStructure(snapshot);
    if (stateChanged(shown, snapshot)) {
      variant.renderState({ selectedId: snapshot.selectedId, hoveredId: snapshot.hoveredId });
    }
    if (searchArea && isNewView(shown?.viewport, snapshot.viewport)) {
      offered = offersSearch(snapshot, listing);
    }
    shown = snapshot;
    showSearchArea();
  }
  function searchHere(): void {
    const snapshot = maplace.getSnapshot();
    scope = scopedTo(snapshot.viewport);
    renderStructure(snapshot);
    offered = false;
    showSearchArea();
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
  searchArea?.button.addEventListener("click", searchHere);
  return () => {
    searchArea?.button.removeEventListener("click", searchHere);
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

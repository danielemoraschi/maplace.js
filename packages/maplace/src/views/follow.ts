import type { Location } from "../location";
import { isListed } from "../location-state";
import type { Maplace, Snapshot } from "../store";
import type { Viewport } from "../viewport";
import type { AreaSwitch } from "./area-switch";
import { type ListRules, listedEntries, structureOf } from "./model";
import type { SearchBox, SearchFound } from "./search-box";
import type { ListVariant } from "./variant";
import { type AreaMode, inViewOf, scopeIn } from "./viewport-scope";

/** Who follows the store, and by which rules. */
export interface Following<Data> {
  readonly variant: ListVariant<Data>;
  readonly rules: ListRules;
  /** With `scope`: the switch between every location and those in the map's view. */
  readonly areaSwitch?: AreaSwitch | undefined;
  /** With `searchLabel`: the box, which follows the store's query and says what it found. */
  readonly searchBox?: SearchBox | undefined;
}

/**
 * Renders now, then on every change: the structure only when locations, filter or the list's
 * scope changed, the state only when selection or hover did. With an area switch, "This area"
 * scopes the list to each new view (`scopeIn`), and a press of either button lists again. Each
 * pass reads the snapshot as it is then, because commits made during delivery are queued.
 */
export function follow<Data>(
  maplace: Maplace<Data>,
  { variant, rules, areaSwitch, searchBox }: Following<Data>,
): () => void {
  let shown: Snapshot<Data> | undefined;
  let mode: AreaMode = "all";
  let scope: Viewport | undefined;
  function sync(): void {
    const snapshot = maplace.getSnapshot();
    const next = scopeIn(mode, scope, snapshot.viewport);
    if (next !== scope || structureChanged(shown, snapshot)) {
      scope = next;
      const listing = listedEntries<Data>(snapshot, inViewOf(scope));
      variant.renderStructure(structureOf(listing, snapshot.locations, rules));
      const found = searchBox && foundFor(snapshot, listing);
      searchBox?.show(snapshot.filter?.query, found);
      areaSwitch?.showEmptyArea(scope !== undefined && listing.length === 0 && found !== "nowhere");
    }
    if (stateChanged(shown, snapshot)) {
      variant.renderState({ selectedId: snapshot.selectedId, hoveredId: snapshot.hoveredId });
    }
    shown = snapshot;
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
  const stopChoosing = areaSwitch?.onChoose((chosen) => {
    mode = chosen;
    sync();
  });
  return () => {
    stopChoosing?.();
    unsubscribe();
  };
}

/** What a query found: how many are listed, or "nowhere"; nothing to say when a scope hides it all. */
function foundFor(snapshot: Snapshot, listing: readonly Location[]): SearchFound {
  if (snapshot.filter?.query === undefined) return undefined;
  if (listing.length > 0) return listing.length;
  return snapshot.locations.some((location) => isListed(location, snapshot.filter))
    ? undefined
    : "nowhere";
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

import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from "react";
import { createListView, type ListViewOptions } from "../index";
import type { Maplace } from "../store";
import { structureChanged } from "../views/follow";
import {
  createEntryPortals,
  EntryContent,
  type EntryPortals,
  type RenderEntry,
} from "./entry-portals";
import { useRerender } from "./hooks";
import { useMaplace } from "./maplace-provider";

/** The list view's options a `<LocationList>` passes on: entry content comes from its children. */
type ListOptions<Data> = Omit<ListViewOptions<Data>, "render">;

export interface LocationListProps<Data = unknown> extends ListOptions<Data> {
  /** An entry's content, for `as: 'list'`: plain content, since the entry itself is the option. */
  readonly children?: RenderEntry<Data> | undefined;
}

/**
 * The store's list view. A change of `as`, `groupHeadings`, `fitAllLabel`, `label` or `heading`
 * builds it again, as `createListView` reads them once; a new `children` function just renders
 * again.
 */
export function LocationList<Data>(props: LocationListProps<Data>): ReactNode {
  const { children, ...options } = props;
  const rerender = useRerender();
  const [portals] = useState(() => createEntryPortals<Data>(rerender));
  const entryPortals = children === undefined ? undefined : portals;
  const place = useListView(options, entryPortals);
  return (
    <>
      <div ref={place} style={{ display: "contents" }} />
      {children &&
        portals
          .listed()
          .map(([id, listed]) => <EntryContent key={id} listed={listed} render={children} />)}
    </>
  );
}

/**
 * The list view, in the div the returned ref goes on, built again when an option changes. A
 * layout effect: the list fills its options as it is made, and their content renders before paint.
 */
function useListView<Data>(
  { as, groupHeadings, fitAllLabel, label, heading }: ListOptions<Data>,
  portals: EntryPortals<Data> | undefined,
): RefObject<HTMLDivElement | null> {
  const store = useMaplace<Data>();
  const place = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const render = portals?.renderEntry;
    const view = createListView(store, { as, groupHeadings, fitAllLabel, label, heading, render });
    place.current?.append(view.element);
    const stopPruning = portals && pruneOnListChanges(store, portals, view.element);
    return () => {
      stopPruning?.();
      view.destroy();
    };
  }, [store, portals, as, groupHeadings, fitAllLabel, label, heading]);
  return place;
}

/** Prunes the entries after the store changes what the list shows: its locations or filter. */
function pruneOnListChanges<Data>(
  store: Maplace<Data>,
  portals: EntryPortals<Data>,
  list: HTMLElement,
): () => void {
  let lastShown = store.getSnapshot();
  return store.subscribe(() => {
    const next = store.getSnapshot();
    if (!structureChanged(lastShown, next)) return;
    lastShown = next;
    portals.prune(list);
  });
}

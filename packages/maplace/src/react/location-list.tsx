import {
  type ReactNode,
  type RefObject,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ControlPosition } from "../adapter";
import { adoptCarriedStyles } from "../adopted-styles";
import { createListView, type ListViewOptions } from "../index";
import { isElement } from "../validate/values";
import {
  createEntryPortals,
  EntryContent,
  type EntryPortals,
  type RenderEntry,
} from "./entry-portals";
import { useRerender } from "./hooks";
import { type MapControls, MapControlsContext, mapControlsOf } from "./map-controls";
import { useMaplace } from "./maplace-provider";

/** The list view's options a `<LocationList>` passes on: entry content comes from its children. */
type ListOptions<Data> = Omit<ListViewOptions<Data>, "render">;

type MountControl = MapControls["mountControl"];

export interface LocationListProps<Data = unknown> extends ListOptions<Data> {
  /** An entry's content, for `as: 'list'`: plain content, since the entry itself is the option. */
  readonly children?: RenderEntry<Data> | undefined;
  /**
   * The corner of the map the list itself goes in, inside a `<MaplaceMap>`, while its map is
   * attached; without it, the list renders where it is.
   */
  readonly position?: ControlPosition | undefined;
}

/**
 * The store's list view. A change of any list option or `position` builds it again, as
 * `createListView` reads them once; a new `children` function just renders again.
 */
export function LocationList<Data>(props: LocationListProps<Data>): ReactNode {
  const { children, ...options } = props;
  const rerender = useRerender();
  const [portals] = useState(() => createEntryPortals<Data>(rerender));
  const entryPortals = children === undefined ? undefined : portals;
  const place = useListView(options, entryPortals);
  return (
    <>
      {!options.position && <div ref={place} style={{ display: "contents" }} />}
      {children &&
        portals
          .listed()
          .map(([id, listed]) => <EntryContent key={id} listed={listed} render={children} />)}
    </>
  );
}

/** The map's `mountControl` for a list with a `position`, which needs a `<MaplaceMap>` above. */
function useMountControl(position: ControlPosition | undefined): MountControl {
  const controls = useContext(MapControlsContext);
  return position && mapControlsOf(controls, "LocationList: position").mountControl;
}

/**
 * The list view, in the div the returned ref goes on or on the map in its `position` while the
 * map is attached, built again when an option or the map changes. A layout effect: the list fills
 * its options as it is made, and their content renders before paint.
 */
function useListView<Data>(
  {
    as,
    groupHeadings,
    fitAllLabel,
    label,
    heading,
    scope,
    searchAreaLabel,
    emptyAreaLabel,
    position,
  }: LocationListProps<Data>,
  portals: EntryPortals<Data> | undefined,
): RefObject<HTMLDivElement | null> {
  const store = useMaplace<Data>();
  const place = useRef<HTMLDivElement>(null);
  const mountControl = useMountControl(position);
  useLayoutEffect(() => {
    if (position && !mountControl) return;
    const render = portals?.renderEntry;
    const listOptions = {
      as,
      groupHeadings,
      fitAllLabel,
      label,
      heading,
      scope,
      searchAreaLabel,
      emptyAreaLabel,
      render,
    } satisfies Record<keyof ListViewOptions<Data>, unknown>;
    const view = createListView(store, listOptions);
    const takeOff = position && mountControl?.(view.element, position);
    if (!position) placeIn(place.current, view.element);
    const stopPruning = portals && pruneOnListChanges(portals, view.element);
    return () => {
      stopPruning?.();
      takeOff?.();
      view.destroy();
    };
  }, [
    store,
    portals,
    as,
    groupHeadings,
    fitAllLabel,
    label,
    heading,
    scope,
    searchAreaLabel,
    emptyAreaLabel,
    position,
    mountControl,
  ]);
  return place;
}

/** `list` put in `place`, where `<LocationList>` renders, styled in that document: a frame's, say. */
function placeIn(place: HTMLElement | null, list: HTMLElement): void {
  if (place === null) return;
  place.append(list);
  adoptCarriedStyles(place.ownerDocument);
}

/**
 * Prunes the entries whenever the list drops nodes, whatever dropped them: the store's locations
 * or filter, or a scope to another view. Content changing inside an entry, or put back at once,
 * prunes nothing.
 */
function pruneOnListChanges<Data>(portals: EntryPortals<Data>, list: HTMLElement): () => void {
  const watch = new MutationObserver((records) => {
    if (records.some((record) => droppedFrom(list, record))) portals.prune(list);
  });
  watch.observe(list, { childList: true, subtree: true });
  return () => watch.disconnect();
}

const ENTRY = '[role="option"]';

/** Whether `record` took an entry out of `list`: content changing inside one prunes nothing. */
function droppedFrom(list: HTMLElement, { removedNodes }: MutationRecord): boolean {
  return Array.from(removedNodes).some(
    (node) => isElement(node) && !list.contains(node) && holdsEntry(node),
  );
}

function holdsEntry(node: Element): boolean {
  return node.matches(ENTRY) || node.querySelector(ENTRY) !== null;
}

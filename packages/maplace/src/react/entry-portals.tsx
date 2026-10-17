import { memo, type ReactNode, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import type { ListEntry } from "../list-view";
import { labelOf } from "../views/model";
import { nameOption } from "../views/option-node";

/** What a list entry renders, as `<LocationList>`'s children give it. */
export type RenderEntry<Data> = (entry: ListEntry<Data>) => ReactNode;

/** A listed entry, and the host its content renders into. */
interface ListedEntry<Data> {
  readonly host: HTMLElement;
  readonly entry: ListEntry<Data>;
}

/**
 * One portal host per listed id, given to the list view as its `render`. The same host for an id
 * every time, so React keeps the content's state as the entry is selected, hovered or redrawn.
 */
export interface EntryPortals<Data> {
  /** A list view's `render`: records the entry and asks for a render. */
  readonly renderEntry: (entry: ListEntry<Data>) => HTMLElement;
  /** Forgets the entries `list` no longer shows, so their content unmounts. */
  prune(list: HTMLElement): void;
  listed(): readonly [string, ListedEntry<Data>][];
}

export function createEntryPortals<Data>(rerender: () => void): EntryPortals<Data> {
  const entries = new Map<string, ListedEntry<Data>>();
  return {
    renderEntry(entry) {
      const { id } = entry.location;
      const host = entries.get(id)?.host ?? document.createElement("div");
      entries.set(id, { host, entry });
      rerender();
      return host;
    },
    prune(list) {
      const gone = [...entries].filter(([, { host }]) => !list.contains(host));
      for (const [id] of gone) entries.delete(id);
      if (gone.length > 0) rerender();
    },
    listed: () => [...entries],
  };
}

interface EntryContentProps<Data> {
  readonly listed: ListedEntry<Data>;
  readonly render: RenderEntry<Data>;
}

/**
 * An entry's content in its host, rendered again only for an entry the list rendered again. The
 * option names itself when the list fills it, before React has put the content in; it is named
 * again once the content is there.
 */
export const EntryContent = memo(function EntryContent<Data>({
  listed,
  render,
}: EntryContentProps<Data>): ReactNode {
  const { host, entry } = listed;
  useLayoutEffect(() => {
    if (host.parentElement) nameOption(host.parentElement, labelOf(entry.location));
  }, [host, entry]);
  return createPortal(render(entry), host);
}) as <Data>(props: EntryContentProps<Data>) => ReactNode;

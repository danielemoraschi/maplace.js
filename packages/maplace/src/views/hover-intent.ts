/** What a view asks of the store's hover: set it, clear its own, or nothing. */
export type HoverCommand = { readonly hover: string } | { readonly unhover: string } | undefined;

/**
 * One view's hover: the entry under the pointer, else the one with keyboard focus (RFC glossary).
 * Each move returns at most one command, so arrowing between entries is one hover, not a clear
 * and a set; and a view only ever clears the hover it set, never the map's or another view's.
 */
export interface HoverIntent {
  pointerEntered(id: string): HoverCommand;
  pointerLeft(): HoverCommand;
  focused(id: string): HoverCommand;
  blurred(): HoverCommand;
  /**
   * Forgets entries the view no longer has and says how its own hover changes: a location left
   * out of the list (`listed: false`) is still on the map, so the store keeps its hover until told.
   */
  retain(hasEntry: (id: string) => boolean): HoverCommand;
  /** The view's own hover, for `destroy` to clear. */
  current(): string | undefined;
}

export function createHoverIntent(): HoverIntent {
  let pointerId: string | undefined;
  let focusedId: string | undefined;
  let applied: string | undefined;

  function settle(): HoverCommand {
    const wanted = pointerId ?? focusedId;
    if (wanted === applied) return undefined;
    const previous = applied;
    applied = wanted;
    if (wanted !== undefined) return { hover: wanted };
    return previous === undefined ? undefined : { unhover: previous };
  }

  return {
    pointerEntered(id) {
      pointerId = id;
      return settle();
    },
    pointerLeft() {
      pointerId = undefined;
      return settle();
    },
    focused(id) {
      focusedId = id;
      return settle();
    },
    blurred() {
      focusedId = undefined;
      return settle();
    },
    retain(hasEntry) {
      if (pointerId !== undefined && !hasEntry(pointerId)) pointerId = undefined;
      if (focusedId !== undefined && !hasEntry(focusedId)) focusedId = undefined;
      return settle();
    },
    current: () => applied,
  };
}

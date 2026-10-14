import type { PresentationState } from "../adapter";
import type { ResolvedPopupOptions } from "../popup";

/** Which location's popup a map should show, the same on every map. */
export interface PopupChoice {
  /**
   * The location whose popup should show: the selected one, or the hovered one with
   * `openOn: 'hover'`, if shown and the user didn't close its popup. Asking again once another
   * location (or none) is wanted forgets that close.
   */
  wanted(presented: PresentationState): string | undefined;
  /** The user closed this location's popup: it stays closed until another location is wanted. */
  dismiss(id: string): void;
}

export function createPopupChoice(openOn: ResolvedPopupOptions["openOn"]): PopupChoice {
  let dismissed: string | undefined;
  return {
    wanted({ selectedId, hoveredId, hiddenIds }) {
      const id = openOn === "click" ? selectedId : hoveredId;
      if (id !== dismissed) dismissed = undefined;
      if (id === undefined || id === dismissed || hiddenIds.has(id)) return undefined;
      return id;
    },
    dismiss(id) {
      dismissed = id;
    },
  };
}

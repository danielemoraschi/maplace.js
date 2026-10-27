import { isFocused } from "./active-element";
import { element } from "./listbox-nodes";
import { scrollOptionIntoList } from "./scroll";

export const AREA_ONLY_CLASS = "maplace-area-only";
export const SHOW_ALL_CLASS = "maplace-show-all";
export const EMPTY_AREA_CLASS = "maplace-empty-area";

/** What a list with `scope` shows above its entries: its two buttons' labels and its status's. */
export interface AreaFilterLabels {
  readonly areaOnly: string;
  readonly showAll: string;
  readonly emptyArea: string;
}

/**
 * Whether the map has moved to a view listing others ("This area only"), whether the list is
 * filtered to a view ("Show all"), and whether that view holds none (the status).
 */
export interface AreaFilterState {
  readonly moved: boolean;
  readonly scoped: boolean;
  readonly emptyArea: boolean;
}

/** The buttons a list with `scope` is filtered to the map's view from, and back to all. */
export interface AreaFilter {
  readonly areaOnly: HTMLButtonElement;
  readonly showAll: HTMLButtonElement;
  /**
   * Shows each part its state asks for. Hiding the focused part hands focus to the first shown of
   * the status, the entries' tab stop (scrolled into the list) and the buttons.
   */
  update(state: AreaFilterState): void;
}

/** An area filter, with the status it shows below its buttons. */
export interface AreaFilterParts extends AreaFilter {
  readonly status: HTMLElement;
}

/** The two buttons and the empty-area status above `entries`, hidden until a state shows them. */
export function createAreaFilter(labels: AreaFilterLabels, entries: HTMLElement): AreaFilterParts {
  const areaOnly = button(AREA_ONLY_CLASS, labels.areaOnly);
  const showAll = button(SHOW_ALL_CLASS, labels.showAll);
  const status = emptyAreaStatus(labels.emptyArea);
  const handFocusOn = () => {
    const tabStop = entries.querySelector<HTMLElement>('[tabindex="0"]');
    const next = [status, tabStop, areaOnly, showAll].find(
      (node): node is HTMLElement => node !== null && !node.hidden,
    );
    next?.focus({ preventScroll: true });
    if (next === tabStop && tabStop !== null) scrollOptionIntoList(entries, tabStop);
  };
  return {
    areaOnly,
    showAll,
    status,
    update(state) {
      const focused = [areaOnly, showAll, status].find(isFocused);
      areaOnly.hidden = !state.moved;
      showAll.hidden = !state.scoped;
      status.hidden = !state.emptyArea;
      if (focused?.hidden) handFocusOn();
    },
  };
}

function button(className: string, label: string): HTMLButtonElement {
  const node = element("button", className) as HTMLButtonElement;
  node.type = "button";
  node.textContent = label;
  node.hidden = true;
  return node;
}

/** What the list says when its view holds none: a status, focusable for the focus handed to it. */
function emptyAreaStatus(label: string): HTMLElement {
  const status = element("div", EMPTY_AREA_CLASS);
  status.setAttribute("role", "status");
  status.tabIndex = -1;
  status.textContent = label;
  status.hidden = true;
  return status;
}

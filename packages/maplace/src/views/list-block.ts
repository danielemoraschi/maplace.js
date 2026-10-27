import { isFocused } from "./active-element";
import { element } from "./listbox-nodes";
import { scrollOptionIntoList } from "./scroll";
import type { ListVariant } from "./variant";

export const LIST_CLASS = "maplace-list";
export const LIST_HEADING_CLASS = "maplace-list-heading";
export const SEARCH_AREA_CLASS = "maplace-search-area";
export const EMPTY_AREA_CLASS = "maplace-empty-area";

/** A list's heading, and whether it is also the list's name (no `label`), so it isn't read twice. */
export interface ListHeading {
  readonly text: string;
  readonly namesList: boolean;
}

/** What a list with `scope` shows above its entries: the button's label, and the empty status's. */
export interface SearchAreaLabels {
  readonly label: string;
  readonly emptyLabel: string;
}

/** What the block holds above the entries, each when given. */
export interface BlockParts {
  readonly heading: ListHeading | undefined;
  readonly searchArea: SearchAreaLabels | undefined;
}

/** Whether the map has moved to a view listing others, and whether the searched one has none. */
export interface SearchAreaState {
  readonly moved: boolean;
  readonly emptyArea: boolean;
}

/** The "Search this area" button a scoped list is scoped again from, and what the block shows. */
export interface SearchArea {
  readonly button: HTMLButtonElement;
  /**
   * Shows the button while `moved`, and the empty status while `emptyArea`. Hiding the focused
   * button hands focus to the status when it shows, else to the entries' tab stop, scrolled into
   * the list.
   */
  update(state: SearchAreaState): void;
}

export interface ListBlock<Data> {
  /** The variant as the view shows it: itself, or in a block with the parts above it. */
  readonly variant: ListVariant<Data>;
  readonly searchArea: SearchArea | undefined;
}

/**
 * `variant` as the view shows it: as it is with no heading and no search area, else in one block
 * (the view's element) holding the heading, the button, the status, then the entries, hidden
 * while all but the heading are. The heading is a plain block, not `role="heading"`: the page's
 * heading levels are the page's own.
 */
export function listBlock<Data>(variant: ListVariant<Data>, parts: BlockParts): ListBlock<Data> {
  if (parts.heading === undefined && parts.searchArea === undefined) {
    return { variant, searchArea: undefined };
  }
  const block = element("div", LIST_CLASS);
  if (parts.heading !== undefined) block.append(headingElement(parts.heading));
  const area = parts.searchArea && searchAreaParts(parts.searchArea);
  if (area !== undefined) block.append(area.button, area.status);
  block.append(variant.element);
  let areaState: SearchAreaState = { moved: false, emptyArea: false };
  const showParts = () => {
    if (area !== undefined) {
      area.button.hidden = !areaState.moved;
      area.status.hidden = !areaState.emptyArea;
    }
    block.hidden = variant.element.hidden && !areaState.moved && !areaState.emptyArea;
  };
  const handFocusOn = () => {
    if (areaState.emptyArea) {
      area?.status.focus({ preventScroll: true });
      return;
    }
    const tabStop = variant.element.querySelector<HTMLElement>('[tabindex="0"]');
    if (tabStop === null) return;
    tabStop.focus({ preventScroll: true });
    scrollOptionIntoList(variant.element, tabStop);
  };
  const searchArea = area && {
    button: area.button,
    update(next: SearchAreaState) {
      if (next.moved === areaState.moved && next.emptyArea === areaState.emptyArea) return;
      const hadFocus = isFocused(area.button);
      areaState = next;
      showParts();
      if (hadFocus && area.button.hidden) handFocusOn();
    },
  };
  const shown: ListVariant<Data> = {
    element: block,
    renderStructure(structure) {
      variant.renderStructure(structure);
      showParts();
    },
    renderState: (state) => variant.renderState(state),
    destroy() {
      variant.destroy();
      block.remove();
    },
  };
  return { variant: shown, searchArea };
}

function headingElement(heading: ListHeading): HTMLElement {
  const title = element("div", LIST_HEADING_CLASS);
  title.textContent = heading.text;
  if (heading.namesList) title.setAttribute("aria-hidden", "true");
  return title;
}

/** The "Search this area" button and the empty-area status, hidden until the state shows them. */
function searchAreaParts(labels: SearchAreaLabels) {
  const button = element("button", SEARCH_AREA_CLASS) as HTMLButtonElement;
  button.type = "button";
  button.textContent = labels.label;
  button.hidden = true;
  const status = element("div", EMPTY_AREA_CLASS);
  status.setAttribute("role", "status");
  status.tabIndex = -1;
  status.textContent = labels.emptyLabel;
  status.hidden = true;
  return { button, status };
}

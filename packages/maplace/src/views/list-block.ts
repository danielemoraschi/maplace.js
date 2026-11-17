import { activeElementAround } from "./active-element";
import { type AreaSwitch, type AreaSwitchLabels, createAreaSwitch } from "./area-switch";
import { createGroupFilter, type GroupFilter } from "./group-filter";
import { element } from "./listbox-nodes";
import { createSearchBox, type SearchBox, type SearchBoxLabels } from "./search-box";
import type { ListVariant } from "./variant";

export const LIST_CLASS = "maplace-list";
export const LIST_HEADING_CLASS = "maplace-list-heading";

/** A list's heading, and whether it is also the list's name (no `label`), so it isn't read twice. */
export interface ListHeading {
  readonly text: string;
  readonly namesList: boolean;
}

/** What the block holds above the entries, each when given. */
export interface BlockParts {
  readonly heading: ListHeading | undefined;
  readonly areaSwitch: AreaSwitchLabels | undefined;
  readonly search: SearchBoxLabels | undefined;
  /** The group filter's accessible name. */
  readonly groupFilter: string | undefined;
}

export interface ListBlock<Data> {
  /** The variant as the view shows it: itself, or in a block with the parts above it. */
  readonly variant: ListVariant<Data>;
  readonly areaSwitch: AreaSwitch | undefined;
  readonly searchBox: SearchBox | undefined;
  readonly groupFilter: GroupFilter | undefined;
}

/**
 * `variant` as the view shows it: as it is with nothing above it, else in one block (the view's
 * element) holding the heading, the search box, the group filter, the area switch and their
 * statuses, then the entries. The block hides while the entries do, unless it holds a box, a
 * switch or a group filter with boxes, which take the focus the entries lose when they empty (the
 * search box first, then the group filter, then the switch), so it never falls to the page. The
 * heading is a plain block, not `role="heading"`: the page's heading levels are the page's own.
 */
export function listBlock<Data>(variant: ListVariant<Data>, parts: BlockParts): ListBlock<Data> {
  if (Object.values(parts).every((part) => part === undefined)) {
    return { variant, areaSwitch: undefined, searchBox: undefined, groupFilter: undefined };
  }
  const block = element("div", LIST_CLASS);
  if (parts.heading !== undefined) block.append(headingElement(parts.heading));
  const searchBox = parts.search && createSearchBox(parts.search);
  const areaSwitch = parts.areaSwitch && createAreaSwitch(parts.areaSwitch);
  const groupFilter =
    parts.groupFilter === undefined ? undefined : createGroupFilter(parts.groupFilter);
  if (searchBox) block.append(searchBox.input);
  if (groupFilter) block.append(groupFilter.element);
  if (areaSwitch) block.append(areaSwitch.group, areaSwitch.status);
  if (searchBox) block.append(searchBox.status);
  block.append(variant.element);
  // The group filter has no boxes while no location has a group: then it is no taker.
  const focusTaker = () =>
    searchBox ?? (groupFilter?.element.hidden === false ? groupFilter : undefined) ?? areaSwitch;
  const shown: ListVariant<Data> = {
    element: block,
    renderStructure(structure) {
      const focusWasIn = holdsFocus(variant.element);
      variant.renderStructure(structure);
      const taker = focusTaker();
      block.hidden = taker === undefined && variant.element.hidden;
      if (taker && focusWasIn && !holdsFocus(variant.element)) taker.focus();
    },
    renderState: (state) => variant.renderState(state),
    renderView: (view) => variant.renderView?.(view),
    destroy() {
      variant.destroy();
      block.remove();
    },
  };
  return { variant: shown, areaSwitch, searchBox, groupFilter };
}

function holdsFocus(node: Element): boolean {
  return node.contains(activeElementAround(node));
}

function headingElement(heading: ListHeading): HTMLElement {
  const title = element("div", LIST_HEADING_CLASS);
  title.textContent = heading.text;
  if (heading.namesList) title.setAttribute("aria-hidden", "true");
  return title;
}

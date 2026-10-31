import { activeElementAround } from "./active-element";
import { type AreaSwitch, type AreaSwitchLabels, createAreaSwitch } from "./area-switch";
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
}

export interface ListBlock<Data> {
  /** The variant as the view shows it: itself, or in a block with the parts above it. */
  readonly variant: ListVariant<Data>;
  readonly areaSwitch: AreaSwitch | undefined;
  readonly searchBox: SearchBox | undefined;
}

/**
 * `variant` as the view shows it: as it is with nothing above it, else in one block (the view's
 * element) holding the heading, the search box, the area switch and their statuses, then the
 * entries. The block hides while the entries do, unless it holds a box or a switch, which never
 * hide and take the focus the entries lose when they empty (the box first), so it never falls to
 * the page. The heading is a plain block, not `role="heading"`: the page's heading levels are the
 * page's own.
 */
export function listBlock<Data>(variant: ListVariant<Data>, parts: BlockParts): ListBlock<Data> {
  if (parts.heading === undefined && parts.areaSwitch === undefined && parts.search === undefined) {
    return { variant, areaSwitch: undefined, searchBox: undefined };
  }
  const block = element("div", LIST_CLASS);
  if (parts.heading !== undefined) block.append(headingElement(parts.heading));
  const searchBox = parts.search && createSearchBox(parts.search);
  const areaSwitch = parts.areaSwitch && createAreaSwitch(parts.areaSwitch);
  if (searchBox) block.append(searchBox.input);
  if (areaSwitch) block.append(areaSwitch.group, areaSwitch.status);
  if (searchBox) block.append(searchBox.status);
  block.append(variant.element);
  const focusTaker = searchBox ?? areaSwitch;
  const shown: ListVariant<Data> = {
    element: block,
    renderStructure(structure) {
      const focusWasIn = holdsFocus(variant.element);
      variant.renderStructure(structure);
      if (!focusTaker) block.hidden = variant.element.hidden;
      else if (focusWasIn && !holdsFocus(variant.element)) focusTaker.focus();
    },
    renderState: (state) => variant.renderState(state),
    destroy() {
      variant.destroy();
      block.remove();
    },
  };
  return { variant: shown, areaSwitch, searchBox };
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

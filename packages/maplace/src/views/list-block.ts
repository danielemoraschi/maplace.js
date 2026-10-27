import { activeElementAround } from "./active-element";
import { type AreaSwitch, type AreaSwitchLabels, createAreaSwitch } from "./area-switch";
import { element } from "./listbox-nodes";
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
}

export interface ListBlock<Data> {
  /** The variant as the view shows it: itself, or in a block with the parts above it. */
  readonly variant: ListVariant<Data>;
  readonly areaSwitch: AreaSwitch | undefined;
}

/**
 * `variant` as the view shows it: as it is with no heading and no area switch, else in one block
 * (the view's element) holding the heading, the area switch and its status, then the entries.
 * The block hides while the entries do, unless it holds a switch, which never hides and takes the
 * focus the entries lose when they empty, so it never falls to the page. The heading is a plain
 * block, not `role="heading"`: the page's heading levels are the page's own.
 */
export function listBlock<Data>(variant: ListVariant<Data>, parts: BlockParts): ListBlock<Data> {
  if (parts.heading === undefined && parts.areaSwitch === undefined) {
    return { variant, areaSwitch: undefined };
  }
  const block = element("div", LIST_CLASS);
  if (parts.heading !== undefined) block.append(headingElement(parts.heading));
  const areaSwitch = parts.areaSwitch && createAreaSwitch(parts.areaSwitch);
  if (areaSwitch) block.append(areaSwitch.group, areaSwitch.status);
  block.append(variant.element);
  const shown: ListVariant<Data> = {
    element: block,
    renderStructure(structure) {
      const focusWasIn = holdsFocus(variant.element);
      variant.renderStructure(structure);
      if (!areaSwitch) block.hidden = variant.element.hidden;
      else if (focusWasIn && !holdsFocus(variant.element)) areaSwitch.focusPressed();
    },
    renderState: (state) => variant.renderState(state),
    destroy() {
      variant.destroy();
      block.remove();
    },
  };
  return { variant: shown, areaSwitch };
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

import {
  type AreaFilter,
  type AreaFilterLabels,
  type AreaFilterState,
  createAreaFilter,
} from "./area-filter";
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
  readonly areaFilter: AreaFilterLabels | undefined;
}

export interface ListBlock<Data> {
  /** The variant as the view shows it: itself, or in a block with the parts above it. */
  readonly variant: ListVariant<Data>;
  readonly areaFilter: AreaFilter | undefined;
}

/**
 * `variant` as the view shows it: as it is with no heading and no area filter, else in one block
 * (the view's element) holding the heading, the area filter's buttons and status, then the
 * entries, hidden while all but the heading are. The heading is a plain block, not
 * `role="heading"`: the page's heading levels are the page's own.
 */
export function listBlock<Data>(variant: ListVariant<Data>, parts: BlockParts): ListBlock<Data> {
  if (parts.heading === undefined && parts.areaFilter === undefined) {
    return { variant, areaFilter: undefined };
  }
  const block = element("div", LIST_CLASS);
  if (parts.heading !== undefined) block.append(headingElement(parts.heading));
  const filter = parts.areaFilter && createAreaFilter(parts.areaFilter, variant.element);
  const filterNodes = filter ? [filter.areaOnly, filter.showAll, filter.status] : [];
  block.append(...filterNodes, variant.element);
  const hidable = [...filterNodes, variant.element];
  const showBlock = () => {
    block.hidden = hidable.every((node) => node.hidden);
  };
  const areaFilter = filter && {
    areaOnly: filter.areaOnly,
    showAll: filter.showAll,
    update(state: AreaFilterState) {
      filter.update(state);
      showBlock();
    },
  };
  const shown: ListVariant<Data> = {
    element: block,
    renderStructure(structure) {
      variant.renderStructure(structure);
      showBlock();
    },
    renderState: (state) => variant.renderState(state),
    destroy() {
      variant.destroy();
      block.remove();
    },
  };
  return { variant: shown, areaFilter };
}

function headingElement(heading: ListHeading): HTMLElement {
  const title = element("div", LIST_HEADING_CLASS);
  title.textContent = heading.text;
  if (heading.namesList) title.setAttribute("aria-hidden", "true");
  return title;
}

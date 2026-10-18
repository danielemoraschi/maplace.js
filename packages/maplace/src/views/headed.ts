import { element } from "./listbox-nodes";
import type { ListVariant } from "./variant";

export const LIST_CLASS = "maplace-list";
export const LIST_HEADING_CLASS = "maplace-list-heading";

/** A list's heading, and whether it is also the list's name (no `label`), so it isn't read twice. */
export interface ListHeading {
  readonly text: string;
  readonly namesList: boolean;
}

/**
 * `variant` under a visible heading, in a block that is the view's element, hidden while the
 * variant is. A plain block, not `role="heading"`: the page's heading levels are the page's own.
 */
export function headed<Data>(variant: ListVariant<Data>, heading: ListHeading): ListVariant<Data> {
  const block = element("div", LIST_CLASS);
  const title = element("div", LIST_HEADING_CLASS);
  title.textContent = heading.text;
  if (heading.namesList) title.setAttribute("aria-hidden", "true");
  block.append(title, variant.element);
  return {
    element: block,
    renderStructure(structure) {
      variant.renderStructure(structure);
      block.hidden = variant.element.hidden;
    },
    renderState: (state) => variant.renderState(state),
    destroy() {
      variant.destroy();
      block.remove();
    },
  };
}

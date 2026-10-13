import { setOptionState } from "./option-node";
import type { MadeGroup } from "./sections";

const LISTBOX_CLASS = "maplace-listbox";
const OPTION_CLASS = "maplace-option";
const GROUP_CLASS = "maplace-group";
const HEADING_CLASS = "maplace-group-heading";
const FIT_ALL_CLASS = "maplace-fit-all";

/** The listbox, named by `label`; it holds options and groups directly (no list markup between). */
export function listboxElement(label: string): HTMLElement {
  const listbox = element("div", LISTBOX_CLASS);
  listbox.setAttribute("role", "listbox");
  listbox.setAttribute("aria-label", label);
  return listbox;
}

/** An option, out of the tab order until the roving tab stop lands on it. */
export function optionElement(): HTMLElement {
  const option = element("div", OPTION_CLASS);
  option.setAttribute("role", "option");
  option.setAttribute("tabindex", "-1");
  return option;
}

/**
 * The "fit all" entry: an option of its own, never keyed by a location id. It starts selected,
 * since nothing else is yet.
 */
export function fitAllElement(label: string): HTMLElement {
  const option = optionElement();
  option.className = FIT_ALL_CLASS;
  option.textContent = label;
  setOptionState(option, { selected: true, hovered: false });
  return option;
}

/**
 * A group of options, named by `aria-label`. Its visible heading is hidden from assistive tech, so
 * it isn't read twice, and needs no generated id for `aria-labelledby`.
 */
export function groupElement(heading: string): MadeGroup {
  const group = element("div", GROUP_CLASS);
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", heading);
  const title = element("div", HEADING_CLASS);
  title.setAttribute("aria-hidden", "true");
  title.textContent = heading;
  return { element: group, head: [title] };
}

/** What tells a listbox's options apart from the rest of its content. */
export interface ListboxOptions {
  readonly listbox: HTMLElement;
  readonly fitAll: HTMLElement | undefined;
  readonly sections: { locationOf(option: Element): unknown };
}

/**
 * The option (or fit-all entry) `target` is in, found through the view's own map, never a selector.
 */
export function optionAt(
  { listbox, fitAll, sections }: ListboxOptions,
  target: EventTarget | null,
): HTMLElement | undefined {
  for (
    let node = target instanceof Element ? target : null;
    node && node !== listbox;
    node = node.parentElement
  ) {
    if (node === fitAll || sections.locationOf(node)) return node as HTMLElement;
  }
  return undefined;
}

function element(tag: string, className: string): HTMLElement {
  const created = document.createElement(tag);
  created.className = className;
  return created;
}

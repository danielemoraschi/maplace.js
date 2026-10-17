import type { ListEntry, ListViewOptions } from "../list-view";
import type { LocationState } from "../location";
import { runSafely } from "../state/safely";
import { child, describeValue, misuse, root } from "../validate/fail";
import { isNode } from "../validate/values";
import { labelOf } from "./model";

/** A `render` function, as `ListViewOptions` takes it. */
export type ListRender<Data> = NonNullable<ListViewOptions<Data>["render"]>;

const RENDER = child(root("createListView"), "render");

/** An option's content: the entry, and the page's `render` if it has one. */
export interface OptionContent<Data> {
  readonly entry: ListEntry<Data>;
  readonly render: ListRender<Data> | undefined;
}

/**
 * The option's content: `render`'s node, or the label as text (never HTML). A `render` that
 * throws or returns something else is the page's bug: the label shows, and the error is rethrown
 * in a microtask.
 */
export function setOptionContent<Data>(
  option: HTMLElement,
  { entry, render }: OptionContent<Data>,
): void {
  const label = labelOf(entry.location);
  const content =
    (render && runSafely(() => renderedNode(render, entry))) ?? document.createTextNode(label);
  // A `render` giving the same node for its id again leaves it in place, its own state kept.
  if (option.firstChild !== content || option.childNodes.length !== 1)
    option.replaceChildren(content);
  nameOption(option, label);
}

/**
 * Names an option by its label when its content has no text (an icon), and by its content
 * otherwise. Again once content rendered later, as React's, is in the option.
 */
export function nameOption(option: HTMLElement, label: string): void {
  if (option.textContent?.trim()) option.removeAttribute("aria-label");
  else option.setAttribute("aria-label", label);
}

/** Selection and hover as ARIA and data attributes; only the selected option has aria-selected. */
export function setOptionState(option: HTMLElement, { selected, hovered }: LocationState): void {
  if (selected) option.setAttribute("aria-selected", "true");
  else option.removeAttribute("aria-selected");
  option.toggleAttribute("data-selected", selected);
  option.toggleAttribute("data-hovered", hovered);
}

function renderedNode<Data>(render: ListRender<Data>, entry: ListEntry<Data>): Node {
  const node: unknown = render(entry);
  if (!isNode(node))
    throw misuse(RENDER, `must return a Node, got ${describeValue(node)}`, "invalid-input");
  return node as Node;
}

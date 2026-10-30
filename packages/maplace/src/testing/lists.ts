import type { Location } from "../location";
import type { ListActions } from "../views/actions";
import { createListbox } from "../views/listbox";
import { type ListRules, type ListStructure, listStructureOf } from "../views/model";

/** A `ListActions` that only records, for variant tests that need no store. */
export function recordingActions(): ListActions & { readonly calls: string[] } {
  const calls: string[] = [];
  const record = (name: string) => (id?: string) =>
    calls.push(id === undefined ? name : `${name}:${id}`);
  return {
    calls,
    choose: record("choose"),
    showAll: record("showAll"),
    hover: record("hover"),
    unhover: record("unhover"),
  };
}

/** Locations at one point, titled by their upper-cased ids: `titled("a")` lists as "A". */
export function titled(...ids: string[]): Location[] {
  return ids.map((id) => ({ id, title: id.toUpperCase(), lat: 0, lng: 0 }));
}

/** Dispatches a keydown on `target` and returns it, to read `defaultPrevented`. */
export function keydown(target: Element, key: string, init?: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

/** The structure a list shows for these locations, all shown. */
export function structureOf(locations: readonly Location[], rules?: ListRules): ListStructure {
  return listStructureOf({ locations, filter: undefined }, rules ?? { groupHeadings: undefined });
}

/** The options in a list element, fit-all included, in document order. */
export function optionsIn(element: Element): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>('[role="option"]'));
}

/** The names of the groups in a list element, in document order; a switch's group is no list's. */
export function groupNamesIn(element: Element): (string | null)[] {
  const groups = element.querySelectorAll('[role="listbox"] [role="group"]');
  return Array.from(groups, (group) => group.getAttribute("aria-label"));
}

/** A container in `parent` with `count` focusable, untabbable options. */
export function focusableList(count: number, parent: ParentNode = document.body) {
  const container = document.createElement("div");
  const options = Array.from({ length: count }, () => {
    const option = document.createElement("div");
    option.tabIndex = -1;
    container.append(option);
    return option;
  });
  parent.append(container);
  return { container, options };
}

/** A listbox named "Places" with an "All" entry, on the page, recording what it asks of a store. */
export function placedListbox(
  locations: readonly Location[],
  { render, groupHeadings = false }: { render?: () => Node; groupHeadings?: boolean } = {},
) {
  const actions = recordingActions();
  const view = createListbox(actions, { label: "Places", fitAllLabel: "All", render });
  document.body.replaceChildren(view.element);
  view.renderStructure(structureOf(locations, { groupHeadings }));
  view.renderState({ selectedId: undefined, hoveredId: undefined });
  return { view, calls: actions.calls, options: optionsIn(view.element) };
}

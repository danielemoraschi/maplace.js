import type { Location } from "../location";
import type { ListActions } from "../views/actions";
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

/** The structure a list shows for these locations, all shown. */
export function structureOf(locations: readonly Location[], rules?: ListRules): ListStructure {
  return listStructureOf({ locations, filter: undefined }, rules ?? { groupHeadings: undefined });
}

/** The options in a list element, fit-all included, in document order. */
export function optionsIn(element: Element): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>('[role="option"]'));
}

/** A container in the document with `count` focusable, untabbable options. */
export function focusableList(count: number) {
  const container = document.createElement("div");
  const options = Array.from({ length: count }, () => {
    const option = document.createElement("div");
    option.tabIndex = -1;
    container.append(option);
    return option;
  });
  document.body.append(container);
  return { container, options };
}

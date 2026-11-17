import { groupKey, type LocationGroup } from "../group-path";
import type { Location } from "../location";
import { choiceStateOf, groupsAfterTicking, groupsAfterUnticking } from "./group-choice";
import { type GroupNode, groupTreeOf } from "./group-tree";
import { reconcile } from "./keyed";
import { element } from "./listbox-nodes";

export const GROUP_FILTER_CLASS = "maplace-group-filter";

/** The groups a filter asks for: none (undefined) shows every group. */
type AskedGroups = readonly LocationGroup[] | undefined;

/** The boxes a list with `groupFilter` is filtered by group from. */
export interface GroupFilter {
  /** Calls `choose` with the groups to ask for after each box ticked or unticked; returns what stops it. */
  onChoose(choose: (groups: AskedGroups) => void): () => void;
  /** Shows a box for each group of `locations`, ticked as `groups` asks. */
  show(locations: readonly Location[], groups: AskedGroups): void;
}

/** A group filter, and the element holding its boxes, hidden while it has none. */
export interface GroupFilterParts extends GroupFilter {
  readonly element: HTMLElement;
  /** Puts focus on the button that opens the boxes. */
  focus(): void;
}

/** A group's item: its box with its name, then the list its subgroups' items go in. */
interface Box {
  readonly path: readonly string[];
  readonly item: HTMLElement;
  readonly input: HTMLInputElement;
  readonly subgroups: HTMLElement;
}

/**
 * A button named `label`, saying how many groups are ticked ("9/10"), that opens and closes a
 * checkbox for each group, in a group named `label`, subgroups in a list under their parent's:
 * closed at first, so the boxes take the list's room only while wanted. A partly ticked group's
 * box is unticked and indeterminate, so a click ticks all of it. Boxes are kept by path across
 * renders, so focus stays on the one a change came from.
 */
export function createGroupFilter(label: string): GroupFilterParts {
  const root = element("div", GROUP_FILTER_CLASS);
  root.hidden = true;
  const ticked = document.createElement("span");
  const chevron = document.createElement("span");
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "▾";
  const opener = document.createElement("button");
  opener.type = "button";
  opener.setAttribute("aria-expanded", "false");
  opener.append(label, ticked, chevron);
  const boxesGroup = document.createElement("div");
  boxesGroup.setAttribute("role", "group");
  boxesGroup.setAttribute("aria-label", label);
  boxesGroup.hidden = true;
  const top = document.createElement("ul");
  boxesGroup.append(top);
  root.append(opener, boxesGroup);
  opener.addEventListener("click", () => {
    boxesGroup.hidden = !boxesGroup.hidden;
    opener.setAttribute("aria-expanded", String(!boxesGroup.hidden));
  });
  let boxes = new Map<string, Box>();
  let tree: readonly GroupNode[] = [];
  let shownLocations: readonly Location[] = [];
  let shownGroups: AskedGroups;

  /** `nodes`' items in `list`, each kept from the last render by its path, or made. */
  function place(nodes: readonly GroupNode[], list: Element, kept: Map<string, Box>): void {
    const items = nodes.map((node) => {
      const key = groupKey(node.path);
      const box = boxes.get(key) ?? newBox(node);
      place(node.children, box.subgroups, kept);
      box.subgroups.hidden = node.children.length === 0;
      kept.set(key, box);
      return box.item;
    });
    reconcile(list, items);
  }

  function show(locations: readonly Location[], groups: AskedGroups): void {
    if (locations !== shownLocations) {
      tree = groupTreeOf(locations).groups.filter((node) => node.name.trim() !== "");
      const kept = new Map<string, Box>();
      place(tree, top, kept);
      boxes = kept;
      root.hidden = tree.length === 0;
    }
    shownLocations = locations;
    shownGroups = groups;
    const states = choiceStateOf(tree, groups);
    for (const [key, { input }] of boxes) {
      input.checked = states.get(key) === "on";
      input.indeterminate = states.get(key) === "mixed";
    }
    const on = [...states.values()].filter((state) => state === "on").length;
    ticked.textContent = `${on}/${states.size}`;
  }

  return {
    element: root,
    show,
    onChoose(choose) {
      const onChange = ({ target }: Event) => {
        const path = [...boxes.values()].find(({ input }) => input === target)?.path;
        if (path === undefined) return;
        choose(
          (target as HTMLInputElement).checked
            ? groupsAfterTicking(tree, shownGroups, path)
            : groupsAfterUnticking(tree, shownGroups, path),
        );
        // Back to what the store holds: a choice it didn't take leaves no box wrong.
        show(shownLocations, shownGroups);
      };
      const listening = new AbortController();
      root.addEventListener("change", onChange, { signal: listening.signal });
      return () => listening.abort();
    },
    focus() {
      opener.focus({ preventScroll: true });
    },
  };
}

/** A group's item, kept for its path, so its name never changes. */
function newBox({ path, name }: GroupNode): Box {
  const item = document.createElement("li");
  const label = document.createElement("label");
  const input = document.createElement("input");
  input.type = "checkbox";
  const subgroups = document.createElement("ul");
  label.append(input, name);
  item.append(label, subgroups);
  return { path, item, input, subgroups };
}

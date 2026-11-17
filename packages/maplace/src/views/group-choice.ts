import { groupKey, groupOfPath, inAnyGroup, isInGroup, type LocationGroup } from "../group-path";
import { type GroupNode, nodesUnder } from "./group-tree";

/** A group's box: ticked, unticked, or partly ticked (some of what is under it). */
export type ChoiceState = "on" | "off" | "mixed";

export function choiceStateOf(
  tree: readonly GroupNode[],
  groups: readonly LocationGroup[] | undefined,
): ReadonlyMap<string, ChoiceState> {
  const nodes = tree.flatMap(nodesUnder);
  const shown = shownGroups(nodes, groups);
  return new Map(nodes.map((node) => [groupKey(node.path), stateOf(node, shown)]));
}

/**
 * The groups to ask for once `path` is ticked: the fewest, a parent for all its subgroups, none
 * (undefined) once every group is ticked. Paths asked for that no location has yet are kept.
 */
export function groupsAfterTicking(
  tree: readonly GroupNode[],
  groups: readonly LocationGroup[] | undefined,
  path: readonly string[],
): readonly LocationGroup[] | undefined {
  return regrouped(tree, groups, path, (shown, key) => shown.add(key));
}

/**
 * The groups to ask for once `path` is unticked, with what was asked for under it: the fewest, an
 * empty list once none is ticked. A group partly ticked shows its subgroups, not its own entries.
 */
export function groupsAfterUnticking(
  tree: readonly GroupNode[],
  groups: readonly LocationGroup[] | undefined,
  path: readonly string[],
): readonly LocationGroup[] | undefined {
  return regrouped(tree, groups, path, (shown, key) => shown.delete(key));
}

/** The groups asking for what is shown once `change` shows or hides each group under `path`. */
function regrouped(
  tree: readonly GroupNode[],
  groups: readonly LocationGroup[] | undefined,
  path: readonly string[],
  change: (shown: Set<string>, key: string) => void,
): readonly LocationGroup[] | undefined {
  const nodes = tree.flatMap(nodesUnder);
  const shown = shownGroups(nodes, groups);
  for (const key of withOwnEntries(nodes.filter((node) => isInGroup(node.path, path)))) {
    change(shown, key);
  }
  if (tree.every((node) => stateOf(node, shown) === "on")) return undefined;
  const unknown = groupsNoneHas(nodes, groups).filter((group) => !isInGroup(group, path));
  return [...fewestGroups(tree, shown), ...unknown];
}

/** The fewest groups asking for what is shown: a group whole, else its subgroups'. */
function fewestGroups(tree: readonly GroupNode[], shown: ReadonlySet<string>): LocationGroup[] {
  return tree.flatMap((node) =>
    stateOf(node, shown) === "on" ? [groupOfPath(node.path)] : fewestGroups(node.children, shown),
  );
}

/** What the filter asks for that no group of the tree is, as no location has it yet: kept asked. */
function groupsNoneHas(
  nodes: readonly GroupNode[],
  groups: readonly LocationGroup[] | undefined,
): LocationGroup[] {
  const known = new Set(nodes.map((node) => groupKey(node.path)));
  return (groups ?? []).filter((group) => !known.has(groupKey(group)));
}

/** The groups whose own entries the filter shows, by key: every one without a filter. */
function shownGroups(
  nodes: readonly GroupNode[],
  groups: readonly LocationGroup[] | undefined,
): Set<string> {
  return new Set(
    withOwnEntries(groups ? nodes.filter((node) => inAnyGroup(node.path, groups)) : nodes),
  );
}

function stateOf(node: GroupNode, shown: ReadonlySet<string>): ChoiceState {
  const own = withOwnEntries(nodesUnder(node));
  const count = own.filter((key) => shown.has(key)).length;
  if (count === own.length) return "on";
  return count === 0 ? "off" : "mixed";
}

/** The keys of the groups among `nodes` that have entries of their own. */
function withOwnEntries(nodes: readonly GroupNode[]): string[] {
  return nodes.filter((node) => node.own.length > 0).map((node) => groupKey(node.path));
}

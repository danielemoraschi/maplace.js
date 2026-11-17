import { depthOf, nameAt } from "../group-path";
import type { Location } from "../location";

/** A group and what is under it: its own locations (their path ends here), then its subgroups. */
export interface GroupNode<Data = unknown> {
  readonly path: readonly string[];
  readonly name: string;
  readonly own: readonly Location<Data>[];
  readonly children: readonly GroupNode<Data>[];
}

/** Locations by group, the groups nested by their paths; those without a group apart. */
export interface GroupTree<Data = unknown> {
  readonly ungrouped: readonly Location<Data>[];
  readonly groups: readonly GroupNode<Data>[];
}

interface GrowingNode<Data> extends GroupNode<Data> {
  readonly own: Location<Data>[];
  readonly children: GrowingNode<Data>[];
  /** Its children by name, to find each level of a path without a key made for it. */
  readonly named: Map<string, GrowingNode<Data>>;
}

/** `locations` by group, each level in first-appearance order: a parent where its first member is. */
export function groupTreeOf<Data>(locations: readonly Location<Data>[]): GroupTree<Data> {
  const ungrouped: Location<Data>[] = [];
  // Not a group: what the outermost groups hang from.
  const root = nodeNamed<Data>("", []);
  for (const location of locations) {
    const { group } = location;
    if (group === undefined) {
      ungrouped.push(location);
      continue;
    }
    let parent = root;
    for (let depth = 0; depth < depthOf(group); depth++) {
      const name = nameAt(group, depth) as string;
      let node = parent.named.get(name);
      if (node === undefined) {
        node = nodeNamed(name, [...parent.path, name]);
        parent.named.set(name, node);
        parent.children.push(node);
      }
      parent = node;
    }
    parent.own.push(location);
  }
  return { ungrouped, groups: root.children };
}

function nodeNamed<Data>(name: string, path: readonly string[]): GrowingNode<Data> {
  return { path, name, own: [], children: [], named: new Map() };
}

/** How many locations are in the group, its subgroups' included. */
export function countOf(node: GroupNode): number {
  return nodesUnder(node).reduce((count, { own }) => count + own.length, 0);
}

/** The group and every group under it, parents first. */
export function nodesUnder<Data>(node: GroupNode<Data>): GroupNode<Data>[] {
  return [node, ...node.children.flatMap(nodesUnder)];
}

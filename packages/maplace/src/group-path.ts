/**
 * A location's group: a name, or a path of up to `MAX_GROUP_DEPTH` names, outermost first
 * (`["Europe", "Italy"]`). A name and a path of that one name are the same group.
 */
export type LocationGroup = string | readonly string[];

/** How deep a group path may go: a region, a country, a city. */
export const MAX_GROUP_DEPTH = 3;

/** The group as a path: a name is a path of one. */
export function groupPathOf(group: LocationGroup | undefined): readonly string[] | undefined {
  return typeof group === "string" ? [group] : group;
}

/** The group a path is written as: one name as itself, a longer path as the path. */
export function groupOfPath(path: readonly string[]): LocationGroup {
  return path.length === 1 ? (path[0] as string) : path;
}

/**
 * Whether `group` is `asked` or one of its subgroups: `asked`'s path starts `group`'s. Paths
 * match from the top, so "Rome" is not Europe › Italy › Rome.
 */
export function isInGroup(group: LocationGroup | undefined, asked: LocationGroup): boolean {
  if (group === undefined || depthOf(asked) > depthOf(group)) return false;
  for (let depth = 0; depth < depthOf(asked); depth++) {
    if (nameAt(asked, depth) !== nameAt(group, depth)) return false;
  }
  return true;
}

/** Whether `group` is in any of `groups`, or under one of them. */
export function inAnyGroup(
  group: LocationGroup | undefined,
  groups: readonly LocationGroup[],
): boolean {
  return groups.some((asked) => isInGroup(group, asked));
}

/**
 * A group as a key, for maps and equality: a name and its one-name path alike, and paths whose
 * names hold any character kept apart.
 */
export function groupKey(group: LocationGroup): string {
  return JSON.stringify(groupPathOf(group));
}

/**
 * How many names the group's path has. With `nameAt`, it reads a group without making a path: a
 * filter tests every location against every group it asks for.
 */
export function depthOf(group: LocationGroup): number {
  return typeof group === "string" ? 1 : group.length;
}

/** The name at `depth` of the group's path. */
export function nameAt(group: LocationGroup, depth: number): string | undefined {
  return typeof group === "string" ? group : group[depth];
}

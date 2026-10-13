import type { Location } from "../location";
import { isShown, type Scope } from "../state/lookup";

/** Locations under one group heading, or none (`heading` undefined). */
export interface ListSection<Data = unknown> {
  readonly heading: string | undefined;
  readonly locations: readonly Location<Data>[];
}

/** What the list shows, apart from selection and hover. */
export interface ListStructure<Data = unknown> {
  readonly sections: readonly ListSection<Data>[];
}

/** How locations become a structure; `matches` narrows them further (room for a search box). */
export interface ListRules {
  readonly groupHeadings: boolean | undefined;
  readonly matches?: ((location: Location) => boolean) | undefined;
}

/** The shown locations that match `rules`, by group when headings are on, else in data order. */
export function listStructureOf<Data>(scope: Scope, rules: ListRules): ListStructure<Data> {
  const listed = (scope.locations as readonly Location<Data>[]).filter(
    (location) => isShown(location, scope.filter) && (rules.matches?.(location) ?? true),
  );
  if (!headingsShown(scope.locations, rules))
    return { sections: [{ heading: undefined, locations: listed }] };
  return { sections: byGroup(listed) };
}

/** What an entry is called: its title if it has text, else its id. */
export function labelOf(location: Location): string {
  return location.title?.trim() ? location.title : location.id;
}

/** Default: on when any location, shown or not, has a group, so headings don't flicker. */
function headingsShown(locations: readonly Location[], rules: ListRules): boolean {
  return rules.groupHeadings ?? locations.some((location) => location.group !== undefined);
}

/** Groups in first-appearance order, ungrouped first; a blank group name gets no heading. */
function byGroup<Data>(locations: readonly Location<Data>[]): ListSection<Data>[] {
  const ungrouped: Location<Data>[] = [];
  const groups = new Map<string, Location<Data>[]>();
  for (const location of locations) {
    const group = location.group;
    if (group === undefined) {
      ungrouped.push(location);
      continue;
    }
    const members = groups.get(group) ?? [];
    if (members.length === 0) groups.set(group, members);
    members.push(location);
  }
  const sections = [...groups].map(([group, members]) => ({
    heading: group.trim() ? group : undefined,
    locations: members,
  }));
  return ungrouped.length > 0
    ? [{ heading: undefined, locations: ungrouped }, ...sections]
    : sections;
}

import type { Location } from "../location";
import { type FilteredLocations, isListed } from "../location-state";

/** Locations under one group heading, or none (`heading` undefined). */
export interface ListSection<Data = unknown> {
  readonly heading: string | undefined;
  readonly locations: readonly Location<Data>[];
}

/** What the list shows, apart from selection and hover. */
export interface ListStructure<Data = unknown> {
  readonly sections: readonly ListSection<Data>[];
}

/** How listed locations become a structure. */
export interface ListRules {
  readonly groupHeadings: boolean | undefined;
}

/** Whether a listed location is kept: in the map's view, for a list with `scope`. */
export type ListedTest = (location: Location) => boolean;

/** The listed locations, by group when headings are on, else in data order. */
export function listStructureOf<Data>(
  filtered: FilteredLocations,
  rules: ListRules,
): ListStructure<Data> {
  return structureOf(listedEntries<Data>(filtered), filtered.locations, rules);
}

/** `entries`, already listed, by group when headings are on for `locations`, else in order. */
export function structureOf<Data>(
  entries: readonly Location<Data>[],
  locations: readonly Location[],
  rules: ListRules,
): ListStructure<Data> {
  if (!headingsShown(locations, rules)) {
    return { sections: [{ heading: undefined, locations: entries }] };
  }
  return { sections: byGroup(entries) };
}

/** The listed locations, those `kept` keeps when given (`viewport-scope.ts`), in data order. */
export function listedEntries<Data>(
  filtered: FilteredLocations,
  kept?: ListedTest | undefined,
): readonly Location<Data>[] {
  return (filtered.locations as readonly Location<Data>[]).filter(
    (location) => isListed(location, filtered.filter) && (kept?.(location) ?? true),
  );
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

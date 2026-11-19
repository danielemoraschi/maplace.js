import type { LatLng } from "../geometry";
import type { Location } from "../location";
import { type FilteredLocations, isListed } from "../location-state";
import { countOf, type GroupNode, groupTreeOf } from "./group-tree";

export { labelOf } from "../location-state";

/**
 * Locations under one group heading, or none (`heading` undefined), then the group's subgroups:
 * its `locations` are those whose path ends at it.
 */
export interface ListSection<Data = unknown> {
  readonly heading: string | undefined;
  /**
   * The heading as read, with its count: set only with `groupCounts` (`flatSections` reads it so);
   * unread without a `heading`.
   */
  readonly label?: string | undefined;
  /** The group's path, which keeps it apart from a namesake elsewhere; empty without a group. */
  readonly path: readonly string[];
  readonly locations: readonly Location<Data>[];
  readonly sections: readonly ListSection<Data>[];
}

/** What the list shows, apart from selection and hover. */
export interface ListStructure<Data = unknown> {
  readonly sections: readonly ListSection<Data>[];
  /** With a list sorted by distance and an origin to measure from. */
  readonly distances?: Distances | undefined;
}

/** How far an entry is, in metres and as the list writes it. */
export interface EntryDistance {
  readonly metres: number;
  readonly label: string;
}

/** How far each entry is, by id, and where from. */
export interface Distances {
  readonly from: LatLng;
  readonly of: ReadonlyMap<string, EntryDistance>;
}

/** How listed locations become a structure. */
export interface ListRules {
  readonly groupHeadings?: boolean | undefined;
  /** Shows after each heading how many are listed under it. */
  readonly groupCounts?: boolean | undefined;
  /** `distance`: nearest first once the store has an origin, each entry saying how far. */
  readonly sort?: "distance" | undefined;
  readonly distanceUnit?: "kilometer" | "mile" | undefined;
}

/** Whether a listed location is kept: in the map's view, for a list with `scope`. */
export type ListedTest = (location: Location) => boolean;

/** `entries`, already listed, by group when headings are on for `locations`, else in order. */
export function structureOf<Data>(
  entries: readonly Location<Data>[],
  locations: readonly Location[],
  rules: ListRules,
): ListStructure<Data> {
  if (!headingsShown(locations, rules)) return { sections: [ungroupedSection(entries)] };
  const { ungrouped, groups } = groupTreeOf(entries);
  const sections = groups.map((node) => sectionOf(node, rules));
  return { sections: ungrouped.length > 0 ? [ungroupedSection(ungrouped), ...sections] : sections };
}

/**
 * `structure` one level deep, for a native select, whose groups can't nest: a section for each group
 * with locations of its own, named by its path ("Europe › Italy"), counting them when it counted.
 */
export function flatSections<Data>(structure: ListStructure<Data>): ListStructure<Data> {
  const flat = (section: ListSection<Data>): ListSection<Data>[] => {
    if (section.heading === undefined) return [section];
    const heading = section.path.join(" › ");
    const label = section.label && `${heading} (${section.locations.length})`;
    const own = section.locations.length > 0 ? [{ ...section, heading, label, sections: [] }] : [];
    return [...own, ...section.sections.flatMap(flat)];
  };
  return { ...structure, sections: structure.sections.flatMap(flat) };
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

/** Default: on when any location, shown or not, has a group, so headings don't flicker. */
function headingsShown(locations: readonly Location[], rules: ListRules): boolean {
  return rules.groupHeadings ?? locations.some((location) => location.group !== undefined);
}

/** The locations listed outside any group. */
function ungroupedSection<Data>(locations: readonly Location<Data>[]): ListSection<Data> {
  return { heading: undefined, path: [], locations, sections: [] };
}

/** A group's section, its subgroups' inside; a blank name gets no heading, a count all under it. */
function sectionOf<Data>(node: GroupNode<Data>, rules: ListRules): ListSection<Data> {
  return {
    heading: node.name.trim() ? node.name : undefined,
    label: rules.groupCounts ? `${node.name} (${countOf(node)})` : undefined,
    path: node.path,
    locations: node.own,
    sections: node.children.map((child) => sectionOf(child, rules)),
  };
}

import { EXAMPLE_GROUPS, type ExampleGroup, type ExampleSection } from "./example-groups.ts";

export { EXAMPLE_GROUPS, type ExampleGroup, type ExampleSection } from "./example-groups.ts";

/** The lines that follow a group's `headingLead` in its page's H1. */
export const HEADING_TAIL = ["on Google Maps", "and MapLibre"] as const;

/** Every example, in its groups' order. */
export const EXAMPLE_SECTIONS: readonly ExampleSection[] = EXAMPLE_GROUPS.flatMap(
  ({ sections }) => sections,
);

/** The group on the home page: the first. */
export const HOME_GROUP: ExampleGroup = EXAMPLE_GROUPS[0] as ExampleGroup;

const isHomeGroup = (group: ExampleGroup) => group.id === HOME_GROUP.id;

/** `section`'s number on the site, `1` for the first, counted across the groups in order. */
export function sectionNumber(section: ExampleSection): number {
  return EXAMPLE_SECTIONS.indexOf(section) + 1;
}

/** The path of `group`'s page: the home page for the first group. */
export function groupPath(group: ExampleGroup): string {
  return isHomeGroup(group) ? "/" : `/examples/${group.id}/`;
}

/** The H1 of `group`'s page, on one line. */
export function groupHeading(group: ExampleGroup): string {
  return [group.headingLead, ...HEADING_TAIL].join(" ");
}

/** The title of `group`'s page: its heading. */
export function groupTitle(group: ExampleGroup): string {
  return `${groupHeading(group)} · Maplace.js`;
}

/** The description of `group`'s page. */
export function groupDescription(group: ExampleGroup): string {
  return group.description;
}

/** The group whose page is at `path`, if any: `location.pathname`, say. */
export function findGroupAtPath(path: string): ExampleGroup | undefined {
  return EXAMPLE_GROUPS.find((group) => groupPath(group) === path);
}

/** The group holding the section named `name`, if any: a URL's hash, say. */
export function findGroupOfSection(name: string): ExampleGroup | undefined {
  return EXAMPLE_GROUPS.find(({ sections }) => sections.some((section) => section.name === name));
}

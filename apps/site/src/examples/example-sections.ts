import { EXAMPLE_GROUPS, type ExampleGroup, type ExampleSection } from "./example-groups.ts";

export {
  EXAMPLE_GROUPS,
  type ExampleGroup,
  type ExampleSection,
  type ReferenceCut,
} from "./example-groups.ts";

/** The lines that follow a page's heading lead in its H1. */
export const HEADING_TAIL = ["on Google Maps", "and MapLibre"] as const;

/** Every example, in its groups' order. */
export const EXAMPLE_SECTIONS: readonly ExampleSection[] = EXAMPLE_GROUPS.flatMap(
  ({ sections }) => sections,
);

/** `section`'s number as the site shows it, `01` for the first, counted across the groups in order. */
export function sectionLabel(section: ExampleSection): string {
  return String(EXAMPLE_SECTIONS.indexOf(section) + 1).padStart(2, "0");
}

/** Where `section` is on the site: its anchor on its group's page. */
export function sectionHref(group: ExampleGroup, section: ExampleSection): string {
  return `${groupPath(group)}#${section.name}`;
}

/** An examples' page's H1 on one line: its lead, then `HEADING_TAIL`. */
export function pageHeading(lead: string): string {
  return [lead, ...HEADING_TAIL].join(" ");
}

/** The path of `group`'s page. */
export function groupPath(group: ExampleGroup): string {
  return `/examples/${group.id}/`;
}

/** The H1 of `group`'s page, on one line. */
export function groupHeading(group: ExampleGroup): string {
  return pageHeading(group.headingLead);
}

/** The description of `group`'s page. */
export function groupDescription(group: ExampleGroup): string {
  return group.description;
}

/** The pages before and after `group`'s, in the groups' order: none before the first, or after the last. */
export function neighbourGroups(group: ExampleGroup): {
  readonly previous: ExampleGroup | undefined;
  readonly next: ExampleGroup | undefined;
} {
  const index = EXAMPLE_GROUPS.indexOf(group);
  return { previous: EXAMPLE_GROUPS[index - 1], next: EXAMPLE_GROUPS[index + 1] };
}

/** The group whose page is at `path`, if any: `location.pathname`, say. */
export function findGroupAtPath(path: string): ExampleGroup | undefined {
  return EXAMPLE_GROUPS.find((group) => groupPath(group) === path);
}

/** The group holding the section named `name`, if any: a URL's hash, say. */
export function findGroupOfSection(name: string): ExampleGroup | undefined {
  return EXAMPLE_GROUPS.find(({ sections }) => sections.some((section) => section.name === name));
}

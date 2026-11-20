import { EXAMPLE_GROUPS, type ExampleGroup, type ExampleSection } from "./example-groups.ts";

export {
  EXAMPLE_GROUPS,
  type ExampleGroup,
  type ExampleSection,
  type ReferenceCut,
} from "./example-groups.ts";

/** The examples page: every example by category, each linking its page (W72), the hubs under it. */
export const EXAMPLES_PAGE_ROUTE = "/examples/";

/** The lines that follow a page's heading lead in its H1. */
export const HEADING_TAIL = ["on Google Maps", "and MapLibre"] as const;

/** An example's page: the example, the group whose hub it sits under, its path and its number. */
export interface ExamplePageEntry {
  readonly group: ExampleGroup;
  readonly section: ExampleSection;
  readonly path: string;
  /** Its number as the site shows it, `01` for the first, counted across the groups in order. */
  readonly number: string;
}

/** Every example's page, in the numbering's order. */
export const EXAMPLE_PAGE_ENTRIES: readonly ExamplePageEntry[] = EXAMPLE_GROUPS.flatMap((group) =>
  group.sections.map((section) => ({ group, section })),
).map(({ group, section }, index) => ({
  group,
  section,
  path: `${groupPath(group)}${section.name}/`,
  number: String(index + 1).padStart(2, "0"),
}));

/** Every example, in its groups' order. */
export const EXAMPLE_SECTIONS: readonly ExampleSection[] = EXAMPLE_PAGE_ENTRIES.map(
  ({ section }) => section,
);

/** The pages of `group`'s examples, in order. */
export function examplePagesOf(group: ExampleGroup): ExamplePageEntry[] {
  return EXAMPLE_PAGE_ENTRIES.filter((entry) => entry.group === group);
}

/** The examples page, then each group's hub followed by its examples' pages, in the numbering's order. */
export const EXAMPLES_ROUTES: readonly string[] = [
  EXAMPLES_PAGE_ROUTE,
  ...EXAMPLE_GROUPS.flatMap((group) => [
    groupPath(group),
    ...examplePagesOf(group).map(({ path }) => path),
  ]),
];

/** An examples' page's H1 on one line: its lead, then `HEADING_TAIL`. */
export function pageHeading(lead: string): string {
  return [lead, ...HEADING_TAIL].join(" ");
}

/** The path of `group`'s hub. */
export function groupPath(group: ExampleGroup): string {
  return `${EXAMPLES_PAGE_ROUTE}${group.id}/`;
}

/** The H1 of `group`'s page, on one line. */
export function groupHeading(group: ExampleGroup): string {
  return pageHeading(group.headingLead);
}

/** The description of `group`'s page. */
export function groupDescription(group: ExampleGroup): string {
  return group.description;
}

/** The group whose page is at `path`, if any: `location.pathname`, say. */
export function findGroupAtPath(path: string): ExampleGroup | undefined {
  return EXAMPLE_GROUPS.find((group) => groupPath(group) === path);
}

/** The page of the example named `name`, if any. */
export function findExamplePage(name: string): ExamplePageEntry | undefined {
  return EXAMPLE_PAGE_ENTRIES.find(({ section }) => section.name === name);
}

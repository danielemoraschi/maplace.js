import { EXAMPLE_GROUPS, type ExampleGroup, type ExampleSection } from "./example-groups.ts";

export {
  EXAMPLE_GROUPS,
  type ExampleGroup,
  type ExampleSection,
  type ReferenceCut,
} from "./example-groups.ts";

/** The examples page: every example by category, each linking its page (W72), the hubs under it. */
export const EXAMPLES_PAGE_ROUTE = "/examples/";

/** An example's page: the example, the group whose hub it sits under, and its path. */
export interface ExamplePageEntry {
  readonly group: ExampleGroup;
  readonly section: ExampleSection;
  readonly path: string;
}

/** Every example's page, in its groups' order. */
export const EXAMPLE_PAGE_ENTRIES: readonly ExamplePageEntry[] = EXAMPLE_GROUPS.flatMap((group) =>
  group.sections.map((section) => ({
    group,
    section,
    path: `${groupPath(group)}${section.name}/`,
  })),
);

/** Every example, in its groups' order. */
export const EXAMPLE_SECTIONS: readonly ExampleSection[] = EXAMPLE_PAGE_ENTRIES.map(
  ({ section }) => section,
);

/** The pages of `group`'s examples, in order. */
export function examplePagesOf(group: ExampleGroup): ExamplePageEntry[] {
  return EXAMPLE_PAGE_ENTRIES.filter((entry) => entry.group === group);
}

/** The examples page, then each group's hub followed by its examples' pages, in their groups' order. */
export const EXAMPLES_ROUTES: readonly string[] = [
  EXAMPLES_PAGE_ROUTE,
  ...EXAMPLE_GROUPS.flatMap((group) => [
    groupPath(group),
    ...examplePagesOf(group).map(({ path }) => path),
  ]),
];

/** A page's H1: its lead, then the two providers it runs on. */
export function pageHeading(lead: string): string {
  return `${lead} on Google Maps and MapLibre`;
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

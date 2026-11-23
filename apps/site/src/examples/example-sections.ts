import { firstTitleWithin } from "../site/head-meta-tags.ts";
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

/** The H1 of a page about the choice of provider (home, the examples page): its lead, then both. */
export function pageHeading(lead: string): string {
  return `${lead} on Google Maps and MapLibre`;
}

/** The path of `group`'s hub. */
export function groupPath(group: ExampleGroup): string {
  return `${EXAMPLES_PAGE_ROUTE}${group.id}/`;
}

/** How a title names the providers, once (W87): searches name one, and match it there. */
const PROVIDERS_IN_TITLE = "Google Maps & MapLibre";

/** The `<title>` of an example's page: its task, then the providers, as a JS example if it fits. */
export function exampleTitle({ title }: ExampleSection): string {
  return providersTitle(title, "JS example");
}

/** The `<title>` of `group`'s hub: its feature, then the providers, as examples if it fits. */
export function groupTitle({ heading }: ExampleGroup): string {
  return providersTitle(heading, "examples");
}

/** `lead`, then the providers and `kind` as far as search shows them whole. */
function providersTitle(lead: string, kind: string): string {
  return firstTitleWithin(
    [`${lead}: ${PROVIDERS_IN_TITLE} ${kind}`, `${lead}: ${PROVIDERS_IN_TITLE}`],
    lead,
  );
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

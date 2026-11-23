import {
  EXAMPLE_GROUPS,
  type ExampleGroup,
  type ExamplePageEntry,
  examplePagesOf,
  groupPath,
} from "../examples/example-sections.ts";
import type { NavLink } from "./nav-link.ts";

/** A group's hub, as a link: its label. */
export function hubLink(group: ExampleGroup): NavLink {
  return { href: groupPath(group), label: group.label };
}

/** An example's page, as a link: its title. */
export function exampleLink({ path, section }: ExamplePageEntry): NavLink {
  return { href: path, label: section.title };
}

/** The examples pages' menu: each category linking its hub, its examples under it, each its page. */
export function examplesMenu(): NavLink[] {
  return EXAMPLE_GROUPS.map((group) => ({
    ...hubLink(group),
    children: examplePagesOf(group).map(exampleLink),
  }));
}

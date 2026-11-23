import {
  EXAMPLE_PAGE_ENTRIES,
  EXAMPLES_PAGE_ROUTE,
  findGroupAtPath,
  groupPath,
} from "../examples/example-sections.ts";
import { HOME_ROUTE } from "../examples/home-page.ts";
import { listedPage } from "./listed-pages.ts";

/** A step of a page's trail from the home page: its name and its route. */
export interface Crumb {
  readonly name: string;
  readonly path: string;
}

/**
 * The trail from the home page to the page at `route`, ending on it, each step named as the
 * site's lists name it (search's breadcrumbs, W83); none for the home page. Throws on a route the
 * site has no page for.
 */
export function breadcrumbsFor(route: string): readonly Crumb[] | undefined {
  if (route === HOME_ROUTE) return undefined;
  return [HOME_ROUTE, ...parentsOf(route), route].map((path) => ({
    name: listedPage(path).name,
    path,
  }));
}

/** The pages between the home page and `route`: the examples page and a hub for an example. */
function parentsOf(route: string): readonly string[] {
  if (route === EXAMPLES_PAGE_ROUTE) return [];
  if (findGroupAtPath(route)) return [EXAMPLES_PAGE_ROUTE];
  const entry = EXAMPLE_PAGE_ENTRIES.find(({ path }) => path === route);
  return entry ? [EXAMPLES_PAGE_ROUTE, groupPath(entry.group)] : [];
}

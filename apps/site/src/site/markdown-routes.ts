import { EXAMPLE_GROUPS, groupPath } from "../examples/example-sections.ts";
import { CHANGELOG_PAGE } from "./footer-pages.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";

/** The pages with Markdown behind them: a new page has none until it is listed here. */
export const MARKDOWN_ROUTES: readonly string[] = [
  ...EXAMPLE_GROUPS.map(groupPath),
  CHANGELOG_PAGE.route,
  ...REPO_DOCS.map(({ id }) => docRoute(id)),
];

/** Where the page at the folder route `route` has its Markdown. */
export function markdownAddress(route: string): string {
  return `${route}index.md`;
}

/** Where the page at `path` has its Markdown, if it has any. */
export function markdownAddressAt(path: string): string | undefined {
  return MARKDOWN_ROUTES.includes(path) ? markdownAddress(path) : undefined;
}

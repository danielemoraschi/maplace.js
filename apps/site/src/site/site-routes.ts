import { EXAMPLE_GROUPS, groupPath } from "../examples/example-sections.ts";
import { FOOTER_PAGES } from "./footer-pages.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";

/** Every page of the site: the examples' groups, the home page first, the footer's and the docs. */
export const SITE_ROUTES: readonly string[] = [
  ...EXAMPLE_GROUPS.map(groupPath),
  ...FOOTER_PAGES.map(({ route }) => route),
  ...REPO_DOCS.map(({ id }) => docRoute(id)),
];

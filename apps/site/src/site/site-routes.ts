import { EXAMPLES_ROUTES } from "../examples/example-sections.ts";
import { HOME_ROUTE } from "../examples/home-page.ts";
import { FOOTER_PAGES } from "./footer-pages.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";

/** Every page of the site: the home page, the examples page, the examples' hubs and pages, the footer's and the docs. */
export const SITE_ROUTES: readonly string[] = [
  HOME_ROUTE,
  ...EXAMPLES_ROUTES,
  ...FOOTER_PAGES.map(({ route }) => route),
  ...REPO_DOCS.map(({ id }) => docRoute(id)),
];

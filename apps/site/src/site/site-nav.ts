import { EXAMPLES_PAGE_ROUTE, EXAMPLES_ROUTES } from "../examples/example-sections.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";

/** A link of the header's nav. */
export interface SiteNavLink {
  readonly label: string;
  readonly href: string;
  /** The pages it stands for as a whole, on which it is marked. */
  readonly sectionPaths?: readonly string[];
}

export const SITE_NAV_LINKS: readonly SiteNavLink[] = [
  {
    label: "Documentation",
    href: docRoute("getting-started"),
    sectionPaths: REPO_DOCS.map(({ id }) => docRoute(id)),
  },
  // The examples page (W72); marked there, and on each hub and example's page.
  { label: "Examples", href: EXAMPLES_PAGE_ROUTE, sectionPaths: EXAMPLES_ROUTES },
];

/** `link`'s `aria-current` on the page at `path`: set on the pages it stands for. */
export function navCurrent(link: SiteNavLink, path: string): "true" | undefined {
  return link.sectionPaths?.includes(path) ? "true" : undefined;
}

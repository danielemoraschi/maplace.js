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
  // Never marked: the group bar shows which group is shown, and a group switch leaves this header.
  { label: "Examples", href: "/#examples" },
];

/** `link`'s `aria-current` on the page at `path`: set on the pages it stands for. */
export function navCurrent(link: SiteNavLink, path: string): "true" | undefined {
  return link.sectionPaths?.includes(path) ? "true" : undefined;
}

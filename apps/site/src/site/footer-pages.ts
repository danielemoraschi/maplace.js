/** A page of the site's own, outside the docs, which the footer links. */
export interface SitePage {
  readonly route: string;
  readonly label: string;
  /** The page's description, for search and sharing. */
  readonly description: string;
}

export const PRIVACY_PAGE: SitePage = {
  route: "/privacy/",
  label: "Privacy",
  description: "What maplacejs's site sends where, what it keeps in your browser, and your rights.",
};

export const CHANGELOG_PAGE: SitePage = {
  route: "/changelog/",
  label: "Changelog",
  description: "Every change to maplacejs a reader would notice, newest first.",
};

export const AGENTS_PAGE: SitePage = {
  route: "/agents/",
  label: "AI agents",
  description:
    "How AI agents can read maplacejs's site: its docs and examples in Markdown, llms.txt, and what robots.txt allows.",
};

/** The footer's links, in order. */
export const FOOTER_PAGES: readonly SitePage[] = [PRIVACY_PAGE, CHANGELOG_PAGE, AGENTS_PAGE];

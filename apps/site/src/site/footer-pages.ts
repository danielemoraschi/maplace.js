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
  description:
    "What Maplace.js's site sends where, what it keeps in your browser, and your rights.",
};

export const CHANGELOG_PAGE: SitePage = {
  route: "/changelog/",
  label: "Changelog",
  description:
    "Every change to Maplace.js a reader would notice, newest first, with the issue it closed if any.",
};

export const AGENTS_PAGE: SitePage = {
  route: "/agents/",
  label: "AI agents",
  description:
    "How AI agents can read Maplace.js's site: its docs and examples in Markdown, llms.txt, its agent skill, and what robots.txt allows.",
};

export const BUILDER_PAGE: SitePage = {
  route: "/builder/",
  label: "Snippet builder",
  description:
    "Paste a CSV, JSON, GeoJSON or a Maplace.js 0.2 config and get a working <maplace-map> to copy, with a live preview. All of it stays in your browser.",
};

/** The footer's links, in order. */
export const FOOTER_PAGES: readonly SitePage[] = [
  BUILDER_PAGE,
  PRIVACY_PAGE,
  CHANGELOG_PAGE,
  AGENTS_PAGE,
];

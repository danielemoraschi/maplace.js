/** A page of the site's own, outside the docs, which the footer links. */
export interface SitePage {
  readonly route: string;
  readonly label: string;
}

export const PRIVACY_PAGE: SitePage = { route: "/privacy/", label: "Privacy" };

export const CHANGELOG_PAGE: SitePage = { route: "/changelog/", label: "Changelog" };

/** The footer's links, in order. */
export const FOOTER_PAGES: readonly SitePage[] = [PRIVACY_PAGE, CHANGELOG_PAGE];

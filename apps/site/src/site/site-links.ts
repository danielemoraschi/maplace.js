import { withLinksResolved } from "../../../../scripts/docs/markdown.ts";

export interface SiteLinks {
  /** The site's page for each repo document it renders, by repo path. */
  readonly routes: Readonly<Record<string, string>>;
  /** Where the repo's other files are read: GitHub's blob URL at a ref. */
  readonly blobBase: string;
}

/**
 * `markdown`, a repo document, with its links to repo paths made to work on the site: a
 * document the site renders goes to its page, anything else to the repo.
 */
export function withSiteLinks(markdown: string, { routes, blobBase }: SiteLinks): string {
  return withLinksResolved(markdown, (link) => {
    const [path = "", anchor] = link.split("#");
    const route = routes[path];
    if (route === undefined) return `${blobBase}${link}`;
    return anchor === undefined ? route : `${route}#${anchor}`;
  });
}

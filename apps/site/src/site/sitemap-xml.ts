/** A page as the sitemap lists it. */
export interface SitemapPage {
  /** Absolute, a `URL.href` of one of the site's own routes: nothing in it needs escaping. */
  readonly url: string;
  /** `YYYY-MM-DD`. */
  readonly lastModified: string;
}

/** The sitemap of `pages`. */
export function sitemapXml(pages: readonly SitemapPage[]): string {
  const entries = pages.map(
    ({ url, lastModified }) => `<url><loc>${url}</loc><lastmod>${lastModified}</lastmod></url>`,
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
}

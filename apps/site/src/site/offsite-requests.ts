/** A page of the deployed site as a browser was served it, and the origin that finally answered. */
export interface ServedPage {
  readonly url: string;
  readonly html: string;
  readonly servedFrom: string;
}

/**
 * What is wrong with a deployed page, as lines to report (W10c). A page answered from elsewhere
 * (Access's login, another site) isn't the site's page, whatever it loads; otherwise, each request
 * its HTML makes off the site: the privacy page allows none before consent. The edge can add
 * scripts the build never sees: on the day wavelace's domain went live, Cloudflare injected its
 * Web Analytics beacon into every page.
 */
export function problemsOf({ url, html, servedFrom }: ServedPage): string[] {
  if (servedFrom !== new URL(url).origin) {
    return [`${url} is served from ${servedFrom}: the page is not the site's own`];
  }
  return strayRequests(html, url).map(
    (request) => `${url} loads ${request}: the privacy page allows no such request before consent`,
  );
}

/** The requests `html`, served at `pageUrl`, makes by itself that it may not before consent. */
export function strayRequests(html: string, pageUrl: string): string[] {
  const { origin } = new URL(pageUrl);
  return addressesRequested(html)
    .map((address) => new URL(address, pageUrl))
    .filter((url) => isStray(url, origin))
    .map(({ href }) => href);
}

// What a page fetches by itself: the src and srcset of what it embeds, and the href of a <link>
// (a sheet, an icon, a preload), its canonical address excepted, which names the page and fetches
// nothing. A link a reader follows isn't a request.
const EMBEDS =
  /<(?:script|img|iframe|source|video|audio|embed|track)\b[^>]*?\ssrc\s*=\s*["']([^"']+)["']/gi;
const IMAGE_SETS = /<(?:img|source)\b[^>]*?\ssrcset\s*=\s*["']([^"']+)["']/gi;
const LINKS = /<link\b(?![^>]*\srel\s*=\s*["']canonical["'])[^>]*?\shref\s*=\s*["']([^"']+)["']/gi;

function addressesRequested(html: string): string[] {
  const embedded = [...html.matchAll(EMBEDS), ...html.matchAll(LINKS)].map(
    ([, address = ""]) => address,
  );
  const inSets = [...html.matchAll(IMAGE_SETS)].flatMap(([, set = ""]) =>
    set.split(",").map((candidate) => candidate.trim().split(/\s+/)[0] ?? ""),
  );
  return [...embedded, ...inSets];
}

// Under /cdn-cgi/ the edge serves what it adds from the site's own address (Zaraz, Rocket
// Loader); its bot check is the exception, strictly necessary.
const ADDED_BY_THE_EDGE = /^\/cdn-cgi\/(?!challenge-platform\/)/;

function isStray(url: URL, origin: string): boolean {
  if (!url.protocol.startsWith("http")) return false;
  return url.origin !== origin || ADDED_BY_THE_EDGE.test(url.pathname);
}

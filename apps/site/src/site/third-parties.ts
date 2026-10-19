/** A link to a third party's own terms. */
export interface TermsLink {
  readonly label: string;
  readonly url: string;
}

/** A service outside this site that its pages have the visitor's browser contact (W9). */
export interface ThirdParty {
  /** Its section's id on the privacy page. */
  readonly id: string;
  readonly name: string;
  /** Where its requests go: these domains and their subdomains. */
  readonly domains: readonly string[];
  readonly terms: readonly TermsLink[];
}

export const GOOGLE_MAPS: ThirdParty = {
  id: "google-maps",
  name: "Google Maps",
  /** Street View's panoramas and photos come from `ggpht.com` and `googleusercontent.com`. */
  domains: ["google.com", "googleapis.com", "gstatic.com", "ggpht.com", "googleusercontent.com"],
  terms: [
    { label: "Google's Privacy Policy", url: "https://policies.google.com/privacy" },
    {
      label: "Google Maps/Google Earth Additional Terms of Service",
      url: "https://maps.google.com/help/terms_maps/",
    },
  ],
};

/**
 * Every third party the site's pages contact: the privacy page has a section for each, and
 * test/site-pages.test.ts fails when a built page asks a host none of these names (the pages' own
 * requests: that test refuses them, so what Maps JS would fetch next is checked live, W10c).
 */
export const THIRD_PARTIES: readonly ThirdParty[] = [GOOGLE_MAPS];

/** The third party a request to `url` goes to, if any. */
export function thirdPartyOf(url: string): ThirdParty | undefined {
  const { hostname } = new URL(url);
  return THIRD_PARTIES.find(({ domains }) => domains.some((domain) => isWithin(hostname, domain)));
}

/** `hostname` is `domain` or one of its subdomains. */
function isWithin(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

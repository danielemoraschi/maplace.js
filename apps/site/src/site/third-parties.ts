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
  /** The pages ask it before the visitor consents to anything (W10c's allowlist before consent). */
  readonly askedBeforeConsent: boolean;
  readonly terms: readonly TermsLink[];
}

export const GOOGLE_MAPS: ThirdParty = {
  id: "google-maps",
  name: "Google Maps",
  /** Street View's panoramas and photos come from `ggpht.com` and `googleusercontent.com`. */
  domains: ["google.com", "googleapis.com", "gstatic.com", "ggpht.com", "googleusercontent.com"],
  askedBeforeConsent: false,
  terms: [
    { label: "Google's Privacy Policy", url: "https://policies.google.com/privacy" },
    {
      label: "Google Maps/Google Earth Additional Terms of Service",
      url: "https://maps.google.com/help/terms_maps/",
    },
  ],
};

export const GITHUB: ThirdParty = {
  id: "github",
  name: "GitHub",
  /** The star button asks `api.github.com` for the repo's count. */
  domains: ["github.com"],
  askedBeforeConsent: true,
  terms: [
    {
      label: "GitHub General Privacy Statement",
      url: "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement",
    },
  ],
};

/**
 * Every third party the site's pages contact: the privacy page has a section for each, and
 * test/site-pages.test.ts fails when a built page asks a host none of these names (the pages' own
 * requests: that test refuses them, so what Maps JS would fetch next is checked live, W10c).
 */
export const THIRD_PARTIES: readonly ThirdParty[] = [GOOGLE_MAPS, GITHUB];

/** The third party a request to `url` goes to, if any. */
export function thirdPartyOf(url: string): ThirdParty | undefined {
  const { hostname } = new URL(url);
  return THIRD_PARTIES.find(({ domains }) => domains.some((domain) => isWithin(hostname, domain)));
}

/** `hostname` is `domain` or one of its subdomains. */
function isWithin(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

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

export const OPENFREEMAP: ThirdParty = {
  id: "openfreemap",
  name: "OpenFreeMap",
  /** MapLibre's default style, its tiles, fonts and icons: all from this host. */
  domains: ["tiles.openfreemap.org"],
  terms: [
    { label: "OpenFreeMap Privacy Policy", url: "https://openfreemap.org/privacy/" },
    { label: "OpenFreeMap Terms of Service", url: "https://openfreemap.org/tos/" },
  ],
};

/**
 * The services the site's maps come from, all behind the one consent ("Load maps"), and the only
 * third parties its pages contact (the star count is the site's own, W44): the privacy page has a
 * section for each (test/privacy-page.test.ts), and after consent every request must go to one of
 * these (W10c's allowlist after consent): test/group-pages.test.ts fails when a built page asks a
 * host none of these names (the pages' own requests: that test refuses them, so what Maps JS would
 * fetch next is checked live).
 */
export const MAP_PROVIDERS: readonly ThirdParty[] = [GOOGLE_MAPS, OPENFREEMAP];

/** The map providers by name, for the placeholder: "Google Maps and OpenFreeMap". */
export const MAP_PROVIDER_NAMES = new Intl.ListFormat("en").format(
  MAP_PROVIDERS.map(({ name }) => name),
);

/** The privacy page's section on the maps' one consent, which every placeholder links. */
export const MAP_PROVIDERS_SECTION = "maps";

/** The third party a request to `url` goes to, if any. */
export function thirdPartyOf(url: string): ThirdParty | undefined {
  const { hostname } = new URL(url);
  return MAP_PROVIDERS.find(({ domains }) => domains.some((domain) => isWithin(hostname, domain)));
}

/** Whether `url` goes to one of the maps' providers, which nothing may ask before consent. */
export function goesToMapProvider(url: string): boolean {
  return thirdPartyOf(url) !== undefined;
}

/** `hostname` is `domain` or one of its subdomains. */
function isWithin(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

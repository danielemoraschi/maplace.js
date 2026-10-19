/** Who runs the site: the privacy page names them as responsible for it. */
export const SITE_MAINTAINER = "Daniele Moraschi";

/** Where questions about the privacy page go. */
export const PRIVACY_CONTACT_EMAIL = "maplace@dmoraschi.com";

/** Who serves the site's pages (D10), and so receives every request made to it. */
export const SITE_HOST = {
  name: "Cloudflare",
  privacyPolicy: "https://www.cloudflare.com/privacypolicy/",
  /** The cookie Cloudflare may set to tell people from automated traffic. */
  securityCookie: "__cf_bm",
} as const;

/** One `@`, a name before it and a dotted domain after it, no spaces. */
const EMAIL_ADDRESS = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/** `value`, checked to be an address, so the privacy page never builds without a way to reach its owner. */
export function contactAddress(value: string): string {
  if (!EMAIL_ADDRESS.test(value)) {
    throw new Error(
      `PRIVACY_CONTACT_EMAIL (site-owner.ts) is not an email address: ${JSON.stringify(value)}`,
    );
  }
  return value;
}

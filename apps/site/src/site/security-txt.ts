import { REPOSITORY_URL } from "./repo-docs.ts";
import { PRIVACY_CONTACT_EMAIL } from "./site-owner.ts";

/**
 * How long a built security.txt stays current: under RFC 9116's year, so every deploy renews it,
 * and offsite.yml's check of the live one has months to warn when deploys stop.
 */
const SECURITY_TXT_MONTHS = 11;

/** Where a security report goes, in SECURITY.md's order: GitHub's private form, then the mail. */
const SECURITY_CONTACTS: readonly string[] = [
  `${REPOSITORY_URL}/security/advisories/new`,
  `mailto:${PRIVACY_CONTACT_EMAIL}`,
];

const DAY_MS = 86_400_000;

/** The site's `/.well-known/security.txt` (RFC 9116, W59) as built at `builtAt`. */
export function securityTxt(builtAt: Date): string {
  const expires = new Date(builtAt);
  expires.setUTCMonth(expires.getUTCMonth() + SECURITY_TXT_MONTHS);
  return [
    ...SECURITY_CONTACTS.map((contact) => `Contact: ${contact}`),
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en",
    `Policy: ${REPOSITORY_URL}/blob/main/SECURITY.md`,
    "",
  ].join("\n");
}

/** The days from `now` until a security.txt's `Expires`; throws for one with none it can read. */
export function daysUntilExpiry(text: string, now: Date): number {
  const expires = Date.parse(/^Expires: (.+)$/m.exec(text)?.[1] ?? "");
  if (Number.isNaN(expires)) throw new Error(`security.txt has no readable Expires: ${text}`);
  return (expires - now.getTime()) / DAY_MS;
}

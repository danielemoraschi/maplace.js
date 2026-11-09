// Whether the live security.txt has more than a month before its Expires (W59), on offsite.yml's
// schedule: every deploy renews it, so it lapses only when deploys stop.
//   node scripts/security-txt-expiry.ts <site-url>
import { daysUntilExpiry } from "../apps/site/src/site/security-txt.ts";

const NOTICE_DAYS = 30;
const FETCH_TIMEOUT_MS = 10_000;

const site = process.argv[2] ?? "";
if (!/^https?:\/\/\S+$/.test(site))
  throw new Error("which site: node scripts/security-txt-expiry.ts https://…");
const url = new URL("/.well-known/security.txt", site);
const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
if (!response.ok) throw new Error(`${url}: ${response.status}`);
const days = Math.floor(daysUntilExpiry(await response.text(), new Date()));
if (days < NOTICE_DAYS) {
  console.log(`::error::${url} expires in ${days} days: deploy the site, which renews it`);
  process.exit(1);
}
console.log(`${url}: ${days} days before it expires`);

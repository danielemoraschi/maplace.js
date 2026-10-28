// Whether a deployed page loads anything from another origin before consent (W10c):
//   node apps/site/src/site/offsite-check.ts <site-url>
// Every page, fetched as a browser is served it, since the edge adds its scripts only to a page a
// browser asks for; its HTML is read, not run, so what a page's scripts fetch is the built site's
// tests' to check (test/site-pages.test.ts). CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET, when
// set, are the service token a preview behind Cloudflare Access lets through. A page with a stray
// request fails the run; one that can't be fetched is reported and fails nothing, unless none could.
import { problemsOf, type ServedPage } from "./offsite-requests.ts";
import { SITE_ROUTES } from "./site-routes.ts";

interface Finding {
  readonly level: "error" | "warning";
  readonly line: string;
}

const BROWSER = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml",
};
const PAGE_TIMEOUT_MS = 10_000;

const site = process.argv[2] ?? "";
if (!/^https?:\/\/\S+$/.test(site)) {
  throw new Error("which site: node apps/site/src/site/offsite-check.ts https://…");
}
const urls = SITE_ROUTES.map((route) => new URL(route, site).href);
const findings = (await Promise.all(urls.map(findingsAt))).flat();
const unchecked = findings.filter(({ level }) => level === "warning").length;
if (unchecked === urls.length) {
  findings.push({ level: "error", line: `no page of ${site} could be fetched` });
}
for (const { level, line } of findings) report(level, line);
if (findings.some(({ level }) => level === "error")) process.exitCode = 1;
else
  report("notice", `${urls.length - unchecked} pages of ${site} load nothing from another origin`);

/** What is wrong with the page at `url`, or that it couldn't be fetched. */
async function findingsAt(url: string): Promise<Finding[]> {
  try {
    return problemsOf(await pageAt(url)).map((line) => ({ level: "error", line }));
  } catch (error) {
    return [{ level: "warning", line: `could not fetch ${url}, so it was not checked: ${error}` }];
  }
}

/**
 * The page at `url` as a browser is served it, with Access's service token when there is one. A
 * redirect isn't followed, as fetch would send the token's headers on to wherever it points: a page
 * sent elsewhere is served from there (Access's login, when the token is refused), and one sent
 * within the site isn't checked.
 */
async function pageAt(url: string): Promise<ServedPage> {
  const response = await fetch(url, {
    headers: { ...BROWSER, ...accessHeaders() },
    redirect: "manual",
    signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
  });
  const location = response.headers.get("location");
  if (location !== null) {
    const target = new URL(location, url);
    if (target.origin === new URL(url).origin) throw new Error(`redirected to ${target.pathname}`);
    return { url, html: "", servedFrom: target.origin };
  }
  if (!response.ok) throw new Error(`answered ${response.status}`);
  return { url, html: await response.text(), servedFrom: new URL(url).origin };
}

function accessHeaders(): Record<string, string> {
  const { CF_ACCESS_CLIENT_ID: id, CF_ACCESS_CLIENT_SECRET: secret } = process.env;
  return id && secret ? { "CF-Access-Client-Id": id, "CF-Access-Client-Secret": secret } : {};
}

/** In a workflow, a line GitHub shows on the run; anywhere else, just the line. */
function report(level: Finding["level"] | "notice", line: string): void {
  console.log(
    process.env.GITHUB_ACTIONS ? `::${level} title=Offsite check::${line}` : `${level}: ${line}`,
  );
}

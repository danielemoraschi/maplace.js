import { pinnedIntegritiesIn } from "../build/cdn-pins.ts";
import { integrityOf } from "../build/subresource-integrity.ts";
import { reasonOf } from "./error-reason.ts";
import { JSDELIVR_CDN, jsDelivrPath } from "./jsdelivr.ts";
import {
  type Fetch,
  LONGEST_NPM_READ_MS,
  PACKAGE_NAME,
  publishedFiles,
  READ_TIMEOUT_MS,
  UNPUBLISHED_VERSION,
} from "./published-package.ts";
import { ReleaseRefused } from "./release-refused.ts";
import { problemsUntilDeadline, type RetryTools } from "./retry-problems.ts";
import { parseVersion } from "./versions.ts";

/** A new file on jsDelivr can lag a publish: how long the check gives it. */
export const CDN_DEADLINE_MS = 10 * 60_000;
const CDN_RETRY_WAIT_MS = 30_000;

/** The longest one attempt can take: npm's two reads with their retries, then the scripts at once. */
export const LONGEST_CDN_ATTEMPT_MS = LONGEST_NPM_READ_MS + READ_TIMEOUT_MS;

/** Any third-party page: `crossorigin="anonymous"` needs the CDN to allow it. */
const PAGE_ORIGIN = "https://example.com";

/** `asked` as a version the check can read; refused, with no network, when it can't be on npm. */
export function checkableVersion(asked: string): string {
  const { text } = parseVersion(asked);
  if (text === UNPUBLISHED_VERSION) {
    throw new ReleaseRefused(`${text} is the unreleased manifest's version, never on npm`);
  }
  return text;
}

/**
 * What is wrong with jsDelivr's copy of a version, against the hashes its published README pins:
 * an empty list when each script is served with its hash, to a third-party page. Tried again,
 * whatever the problem, until a deadline; then the last attempt's problems.
 */
export async function cdnProblems(
  version: string,
  { fetchUrl, ...clock }: RetryTools,
): Promise<readonly string[]> {
  let pins: ReadonlyMap<string, string> | undefined;
  const attempt = async () => {
    try {
      pins ??= await pinsOnNpm(version, fetchUrl);
      return await problemsServing(version, pins, fetchUrl);
    } catch (error) {
      return [(error as Error).message];
    }
  };
  return problemsUntilDeadline(
    attempt,
    { deadlineMs: CDN_DEADLINE_MS, waitMs: CDN_RETRY_WAIT_MS },
    clock,
  );
}

/** Refused while npm's read lags the publish, and for a README that pins nothing to compare. */
async function pinsOnNpm(version: string, fetchUrl: Fetch): Promise<ReadonlyMap<string, string>> {
  const files = await publishedFiles(version, fetchUrl);
  if (files === undefined) throw new Error(`${PACKAGE_NAME}@${version} isn't on npm`);
  const readme = files.get("README.md");
  if (readme === undefined) throw new Error(`${PACKAGE_NAME}@${version} has no README.md`);
  const pins = pinnedIntegritiesIn(new TextDecoder().decode(readme), version);
  if (pins.size === 0) throw new Error(`${PACKAGE_NAME}@${version}'s README pins no script`);
  return pins;
}

async function problemsServing(
  version: string,
  pins: ReadonlyMap<string, string>,
  fetchUrl: Fetch,
): Promise<readonly string[]> {
  const problems = await Promise.all(
    Array.from(pins, ([file, integrity]) =>
      problemServing(version, file, integrity, fetchUrl).catch(
        (error) => `${file}: jsDelivr can't be read: ${reasonOf(error)}`,
      ),
    ),
  );
  return problems.filter((problem) => problem !== undefined);
}

async function problemServing(
  version: string,
  file: string,
  integrity: string,
  fetchUrl: Fetch,
): Promise<string | undefined> {
  const exactVersion = `@${version}`;
  const response = await fetchUrl(`${JSDELIVR_CDN}${jsDelivrPath(exactVersion, file)}`, {
    headers: { Origin: PAGE_ORIGIN },
    signal: AbortSignal.timeout(READ_TIMEOUT_MS),
  });
  if (!response.ok) return `${file}: jsDelivr answered ${response.status}`;
  const served = integrityOf(new Uint8Array(await response.arrayBuffer()));
  if (served !== integrity)
    return `${file}: jsDelivr serves ${served}, the README pins ${integrity}`;
  const allowed = response.headers.get("access-control-allow-origin");
  if (allowed === "*" || allowed === PAGE_ORIGIN) return undefined;
  return `${file}: jsDelivr doesn't allow a page's origin (Access-Control-Allow-Origin: ${allowed})`;
}

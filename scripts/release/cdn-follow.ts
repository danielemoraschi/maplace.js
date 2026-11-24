import { floatingAliases, floatingPaths, purgeProblems } from "./cdn-purge.ts";
import { reasonOf } from "./error-reason.ts";
import { JSDELIVR_CDN } from "./jsdelivr.ts";
import { type Fetch, READ_TIMEOUT_MS } from "./published-package.ts";
import { problemsUntilDeadline, type RetryTools } from "./retry-problems.ts";
import type { Version } from "./versions.ts";

/** How long the purge gives jsDelivr's floating paths to move to a release, and the wait between tries. */
export const FOLLOW_TIMES = { deadlineMs: 3 * 60_000, waitMs: 30_000 };

/** The longest `floatingUrlProblems` can take: its deadline, then a last attempt's purge and asking. */
export const LONGEST_FOLLOW_MS = FOLLOW_TIMES.deadlineMs + 2 * READ_TIMEOUT_MS;

/** A floating path jsDelivr doesn't yet serve the release at, and what it answers instead. */
interface Behind {
  readonly path: string;
  readonly problem: string;
}

/**
 * What keeps jsDelivr's floating URLs of `files` (`@1`, `@latest`…) from serving `version`: an
 * empty list once each answers it. Each is purged, asked, and purged again while it lags, until a
 * deadline: a URL purged while jsDelivr still resolves its alias to the version before caches that
 * one again. A path jsDelivr won't purge again yet is left to its answer, and logged.
 */
export async function floatingUrlProblems(
  version: Version,
  files: readonly string[],
  { fetchUrl, ...clock }: RetryTools,
): Promise<readonly string[]> {
  let lagging = floatingPaths(floatingAliases(version), files);
  const attempt = async () => {
    const { problems, throttled } = await purgeProblems(lagging, fetchUrl);
    if (throttled.length > 0) {
      clock.log(
        `jsDelivr purged ${throttled.length} of the floating paths too recently to purge again: their answers tell`,
      );
    }
    if (problems.length > 0) return problems;
    const answers = await Promise.all(
      lagging.map(async (path) => ({ path, problem: await pathProblem(version, path, fetchUrl) })),
    );
    const behind = answers.filter((answer): answer is Behind => answer.problem !== undefined);
    lagging = behind.map(({ path }) => path);
    return behind.map(({ problem }) => problem);
  };
  return problemsUntilDeadline(attempt, FOLLOW_TIMES, clock);
}

/** What `path` answers instead of `version`; nothing once jsDelivr serves the release there. */
async function pathProblem(
  version: Version,
  path: string,
  fetchUrl: Fetch,
): Promise<string | undefined> {
  try {
    const response = await fetchUrl(`${JSDELIVR_CDN}${path}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    });
    if (!response.ok) return `${path} answered ${response.status}`;
    const answered = response.headers.get("x-jsd-version");
    if (answered === version.text) return undefined;
    return `${path} still answers ${answered ?? "no version"}`;
  } catch (error) {
    return `${path} can't be asked: ${reasonOf(error)}`;
  }
}

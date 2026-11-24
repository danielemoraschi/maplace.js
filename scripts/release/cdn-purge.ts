import { pinnedScriptsIn } from "../build/cdn-pins.ts";
import { reasonOf } from "./error-reason.ts";
import { JSDELIVR_PURGE, jsDelivrPath } from "./jsdelivr.ts";
import { type Fetch, READ_TIMEOUT_MS } from "./published-package.ts";
import { ReleaseRefused } from "./release-refused.ts";
import { isPrerelease, type Version } from "./versions.ts";

/** What jsDelivr answers a purge of one path: done everywhere only when every provider says so. */
interface PurgeAnswer {
  readonly status?: string;
  readonly paths?: Readonly<
    Record<string, { readonly throttled?: boolean; readonly providers?: Record<string, boolean> }>
  >;
}

/**
 * The aliases a release moves on jsDelivr, each cached up to 12 hours at its edges: its major,
 * its minor, `@latest` and the bare package. A pre-release moves none.
 */
export function floatingAliases(version: Version): readonly string[] {
  if (isPrerelease(version)) return [];
  return [`@${version.major}`, `@${version.major}.${version.minor}`, "@latest", ""];
}

/** The scripts the README pins, as the repo writes it, each with its source map. */
export function pinnedFiles(readme: string): readonly string[] {
  const scripts = pinnedScriptsIn(readme);
  if (scripts.length === 0) throw new ReleaseRefused("the README pins no script");
  return scripts.flatMap((script) => [script, `${script}.map`]);
}

/** Each file under each alias, as jsDelivr's paths name them. */
export function floatingPaths(
  aliases: readonly string[],
  files: readonly string[],
): readonly string[] {
  return aliases.flatMap((alias) => files.map((file) => jsDelivrPath(alias, file)));
}

/** What a purge of the floating paths came to: what kept any from being forgotten, and which
 * jsDelivr wouldn't purge again yet (it throttles repeated purges of a path). */
export interface PurgeResult {
  readonly problems: readonly string[];
  readonly throttled: readonly string[];
}

/** A path jsDelivr purged too recently to purge again: what it serves is for its answer to tell. */
const THROTTLED = Symbol("throttled");

/** What purging one path came to: its problem, named by it, `THROTTLED`, or nothing once purged. */
type PurgeOutcome = string | typeof THROTTLED | undefined;

/**
 * Each path purged on jsDelivr: its problems, by path, an empty list when every path was purged on
 * every provider or throttled. Never throws: a failed request is its path's problem.
 */
export async function purgeProblems(
  paths: readonly string[],
  fetchUrl: Fetch,
): Promise<PurgeResult> {
  const outcomes = await Promise.all(paths.map((path) => purgeOutcome(path, fetchUrl)));
  return {
    problems: outcomes.filter((outcome) => typeof outcome === "string"),
    throttled: paths.filter((_path, index) => outcomes[index] === THROTTLED),
  };
}

/** What kept jsDelivr from forgetting `path`, named by it; nothing once it did, everywhere. */
async function purgeOutcome(path: string, fetchUrl: Fetch): Promise<PurgeOutcome> {
  try {
    const outcome = await answerProblem(path, fetchUrl);
    return typeof outcome === "string" ? `${path}: ${outcome}` : outcome;
  } catch (error) {
    return `${path}: jsDelivr's purge can't be reached: ${reasonOf(error)}`;
  }
}

async function answerProblem(path: string, fetchUrl: Fetch): Promise<PurgeOutcome> {
  const response = await fetchUrl(`${JSDELIVR_PURGE}${path}`, {
    signal: AbortSignal.timeout(READ_TIMEOUT_MS),
  });
  if (!response.ok) return `jsDelivr's purge answered ${response.status}`;
  const answer = (await response.json().catch(() => undefined)) as PurgeAnswer | undefined;
  if (answer === undefined) return "jsDelivr's purge gave no JSON answer";
  return problemIn(path, answer);
}

function problemIn(path: string, { status, paths }: PurgeAnswer): PurgeOutcome {
  if (status !== "finished") return `jsDelivr's purge is ${status ?? "of no status"}`;
  const purged = paths?.[path];
  if (purged === undefined) return "jsDelivr's purge doesn't name it";
  if (purged.throttled === true) return THROTTLED;
  const providers = Object.entries(purged.providers ?? {});
  if (providers.length === 0) return "jsDelivr's purge names no provider";
  const failed = providers.filter(([, done]) => !done);
  if (failed.length === 0) return undefined;
  return `not purged on ${failed.map(([provider]) => provider).join(", ")}`;
}

import { outputLines } from "../build/git.ts";
import { EXAMPLES_DIR, PACKAGE_DIR, SRC } from "../build/package.ts";
import { CHANGELOG_FILE } from "../docs/changelog-lines.ts";
import { type Gh, verifiedOnMain } from "./ci-verified.ts";
import { ReleaseRefused } from "./release-refused.ts";
import { TAG_PREFIX, tagOf } from "./tags.ts";
import { compareVersions, isPrerelease, tryParseVersion, type Version } from "./versions.ts";

/** Git in the checkout a deploy runs from, with fixed arguments: its output; throws on a failure. */
export type Git = (args: readonly string[]) => string;

/** What production deploys (R9, R10, R12): a commit, its release, and what holds it back. */
export interface DeployTarget {
  /** The newest stable release's tag, `v<version>`, on `main`. */
  readonly tag: string;
  readonly commit: string;
  /** The release tag's own commit: its gates are the release's, so CI's need not be asked. */
  readonly isRelease: boolean;
  /** The first commit since the release that changed what only a release may change. */
  readonly heldBackBy?: string;
}

/**
 * What only a release may change on `main`, as git pathspecs: what it builds and numbers (the
 * package, but its examples, their runners and its tests, which npm never gets and which can use
 * only the released API there) and the CHANGELOG, whose unreleased lines would show on the site.
 */
const RELEASE_ONLY_PATHSPECS = [
  PACKAGE_DIR,
  `:(exclude)${EXAMPLES_DIR}`,
  `:(exclude)${SRC}/testing/examples`,
  `:(exclude,glob)${SRC}/**/*.test.*`,
  `:(exclude,glob)${SRC}/**/*.test-d.*`,
  CHANGELOG_FILE,
];

/**
 * What production deploys from `main` of `repo`: `deployTarget`'s commit, refused unless it is the
 * release's own, whose gates are the release's, or CI's verify passed on it on `main`.
 */
export function verifiedDeployTarget(git: Git, gh: Gh, repo: string, main: string): DeployTarget {
  const target = deployTarget(git, main);
  if (!target.isRelease && !verifiedOnMain(gh, repo, target.commit)) {
    throw new ReleaseRefused(
      `CI's verify hasn't passed on ${target.commit} on ${main}: wait for it, then deploy again. CI runs on a push's last commit only: an earlier one waits for a release.`,
    );
  }
  return target;
}

/**
 * Against the newest stable release on `main`: the newest commit on `main` whose release-only
 * files are still the release's, `main` itself when none changed since, else the commit before
 * the first that changed them, so a deploy never goes back past what an earlier one put live.
 */
export function deployTarget(git: Git, main: string): DeployTarget {
  const tag = newestStableTag(git, main);
  const changes = git([
    "rev-list",
    "--reverse",
    "--first-parent",
    `${tag}..${main}`,
    "--",
    ...RELEASE_ONLY_PATHSPECS,
  ]);
  const [heldBackBy] = outputLines(changes);
  const commit = commitOf(git, heldBackBy === undefined ? main : `${heldBackBy}^`);
  const isRelease = commit === commitOf(git, `${tag}^{commit}`);
  return heldBackBy === undefined
    ? { tag, commit, isRelease }
    : { tag, commit, isRelease, heldBackBy };
}

/**
 * The newest stable release's tag, by the release's own versions (`versions.ts`). Tags aren't
 * protected, so one not on `main` is refused, whatever made the check fail.
 */
function newestStableTag(git: Git, main: string): string {
  const newest = outputLines(git(["tag", "--list", tagOf("*")]))
    .map((tag) => tryParseVersion(tag.slice(TAG_PREFIX.length)))
    .filter((version): version is Version => version !== undefined && !isPrerelease(version))
    .sort(compareVersions)
    .at(-1);
  if (newest === undefined) throw new ReleaseRefused("no release tag to deploy");
  const tag = tagOf(newest.text);
  try {
    git(["merge-base", "--is-ancestor", tag, main]);
  } catch (cause) {
    throw new ReleaseRefused(`${tag} isn't on ${main}`, { cause });
  }
  return tag;
}

function commitOf(git: Git, revision: string): string {
  return git(["rev-parse", "--verify", revision]).trim();
}

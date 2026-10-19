import { CHANGELOG_FILE, verbOf } from "../docs/changelog-lines.ts";
import { shippedLines } from "./changelog-release.ts";
import { ReleaseRefused } from "./release-refused.ts";
import { TAG_PREFIX, tagOf } from "./tags.ts";
import { assertMeetsFloor } from "./version-floor.ts";
import {
  compareVersions,
  isPrerelease,
  parseVersion,
  tryParseVersion,
  type Version,
} from "./versions.ts";

interface Request {
  /** The version asked for, as typed. */
  readonly version: string;
  /** The repo's tags. */
  readonly tags: readonly string[];
  readonly changelog: string;
}

export interface ReleasePlan {
  readonly tag: string;
  /** npm's dist-tag: a pre-release never becomes `latest`. */
  readonly distTag: "latest" | "next";
  readonly prerelease: boolean;
  /** The highest version released before, which npm must already have. */
  readonly lastReleased: string | undefined;
}

/** The release of `version`, or why there is none: each guard throws `ReleaseRefused`. */
export function planRelease({ version: asked, tags, changelog }: Request): ReleasePlan {
  const version = parseVersion(asked);
  const released = releasedVersions(tags);
  const last = released.at(-1);
  // A stable release ships its pre-releases' lines too, and is judged by them.
  const lines = shippedLines(changelog.split("\n"), version);
  assertNotLegacy(version);
  assertAboveReleased(version, last);
  assertHasLines(lines);
  assertInFormat(lines);
  assertMeetsFloor(version, { lastStable: released.findLast((v) => !isPrerelease(v)), lines });
  const prerelease = isPrerelease(version);
  return {
    tag: tagOf(version.text),
    distTag: prerelease ? "next" : "latest",
    prerelease,
    lastReleased: last?.text,
  };
}

/** The versions tagged `v1.0.0` and up, lowest first: the 0.x tags predate this workflow. */
function releasedVersions(tags: readonly string[]): Version[] {
  return tags
    .flatMap((tag) => {
      const version = tag.startsWith(TAG_PREFIX) ? tryParseVersion(tag.slice(1)) : undefined;
      return version === undefined ? [] : [version];
    })
    .filter(isOnReleasedLine)
    .sort(compareVersions);
}

function assertNotLegacy(version: Version): void {
  if (isOnReleasedLine(version)) return;
  throw new ReleaseRefused(`${version.text} is below 1.0.0: the 0.x versions are the legacy line`);
}

function assertAboveReleased(version: Version, highest: Version | undefined): void {
  if (highest === undefined || compareVersions(version, highest) > 0) return;
  throw new ReleaseRefused(
    `${version.text} is not above ${tagOf(highest.text)}, the highest release`,
  );
}

function assertHasLines(lines: readonly string[]): void {
  if (lines.length > 0) return;
  throw new ReleaseRefused(`${CHANGELOG_FILE} has no unreleased lines: nothing to release`);
}

/** The floor reads each line's verb, so a line out of format is refused here, before the suite. */
function assertInFormat(lines: readonly string[]): void {
  const malformed = lines.find((line) => verbOf(line) === undefined);
  if (malformed === undefined) return;
  throw new ReleaseRefused(`${CHANGELOG_FILE} has a line out of format: ${malformed}`);
}

/** 1.0.0 and up: the line this workflow releases. */
function isOnReleasedLine({ major }: Version): boolean {
  return major >= 1;
}

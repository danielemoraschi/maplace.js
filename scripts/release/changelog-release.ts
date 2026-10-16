import {
  CHANGELOG_FILE,
  isHeadingOf,
  isListLine,
  isVersionHeading,
  releaseHeading,
  untilNextHeading,
  untilNextStableHeading,
} from "../checks/changelog-lines.ts";
import { withAbsoluteLinks } from "../checks/markdown.ts";
import { isPrerelease, parseVersion, type Version } from "./versions.ts";

export interface Release {
  readonly version: string;
  /** `YYYY-MM-DD`. */
  readonly date: string;
}

interface Notes {
  readonly version: string;
  /** Where the repo's files are at the release's tag: `https://github.com/o/r/blob/v1.1.0/`. */
  readonly blobBase: string;
}

/**
 * The changelog with the release's heading on top of what it ships: its unreleased lines, and
 * for a stable release the pre-releases' sections below them.
 */
export function withReleaseHeading(changelog: string, { version, date }: Release): string {
  const lines = changelog.split("\n");
  const first = lines.findIndex((line) => isListLine(line) || isVersionHeading(line));
  lines.splice(first === -1 ? lines.length : first, 0, releaseHeading(version, date), "");
  return lines.join("\n");
}

/**
 * The GitHub release's body: the version's lines, a stable version's pre-releases' too, their
 * links absolute at its tag (P5).
 */
export function releaseNotes(changelog: string, { version, blobBase }: Notes): string {
  const lines = shippedLines(sectionOf(changelog.split("\n"), version), parseVersion(version));
  return `${lines.map((line) => withAbsoluteLinks(line, blobBase)).join("\n")}\n`;
}

/**
 * The list lines `version` ships from the top of `lines`: up to the next heading for a
 * pre-release, past its pre-releases' to the last stable one's for a stable release.
 */
export function shippedLines(lines: readonly string[], version: Version): string[] {
  const shipped = isPrerelease(version) ? untilNextHeading(lines) : untilNextStableHeading(lines);
  return shipped.filter(isListLine);
}

/** The lines below `version`'s heading. */
function sectionOf(lines: readonly string[], version: string): readonly string[] {
  const heading = lines.findIndex((line) => isHeadingOf(version, line));
  if (heading === -1) throw new Error(`${CHANGELOG_FILE} has no heading for ${version}`);
  return lines.slice(heading + 1);
}

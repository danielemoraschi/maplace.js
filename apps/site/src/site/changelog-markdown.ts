import {
  CHANGELOG_FILE,
  isListLine,
  isVersionHeading,
  malformedLines,
} from "../../../../scripts/checks/changelog-lines.ts";
import { type SiteLinks, withSiteLinks } from "./site-links.ts";

/** Where the changelog's links go on the site. */
export interface ChangelogLinks extends SiteLinks {
  /** A GitHub issue's page, before its number: `https://github.com/o/r/issues/`. */
  readonly issueBase: string;
}

/** The CHANGELOG's own word for the lines above the first version heading. */
const UNRELEASED_HEADING = "## Unreleased";

/** A line in format opens with its date (group 1). */
const DATED_LINE = /^- (\d{4}-\d{2}-\d{2}) /;

/** The `#N` words at a line's end: the issues the CHANGELOG check reads (`issuesNamedIn`). */
const TRAILING_ISSUES = /(?: #\d+)+$/;
const ISSUE = /#(\d+)/g;

/**
 * CHANGELOG.md as `/changelog/` shows it: from its first line or version heading on, unreleased
 * lines headed, each line's date a `<time>` and its issues linked. Throws on a line out of format.
 */
export function changelogMarkdown(changelog: string, links: ChangelogLinks): string {
  refuseMalformedLines(changelog);
  const lines = withUnreleasedHeading(withoutPreamble(changelog.split("\n")));
  const body = lines.map((line) =>
    isListLine(line) ? entryMarkdown(line, links.issueBase) : line,
  );
  return withSiteLinks(body.join("\n"), links);
}

function refuseMalformedLines(changelog: string): void {
  const malformed = malformedLines(changelog);
  if (malformed.length > 0) {
    throw new Error(
      `${CHANGELOG_FILE} ${malformed.join("; ")} doesn't open with its date and what it did`,
    );
  }
}

/** The lines from the first list line or version heading on: the title and intro dropped. */
function withoutPreamble(lines: readonly string[]): readonly string[] {
  const start = lines.findIndex((line) => isListLine(line) || isVersionHeading(line));
  return start === -1 ? [] : lines.slice(start);
}

function withUnreleasedHeading(lines: readonly string[]): readonly string[] {
  const [first] = lines;
  return first !== undefined && isListLine(first) ? [UNRELEASED_HEADING, "", ...lines] : lines;
}

function entryMarkdown(line: string, issueBase: string): string {
  return withIssueLinks(withDateMarked(line), issueBase);
}

function withDateMarked(line: string): string {
  return line.replace(DATED_LINE, '- <time datetime="$1">$1</time> ');
}

function withIssueLinks(line: string, issueBase: string): string {
  return line.replace(TRAILING_ISSUES, (issues) =>
    issues.replaceAll(ISSUE, (_, issue: string) => `[#${issue}](${issueBase}${issue})`),
  );
}

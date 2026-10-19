/** A GitHub closing keyword with this repo's issue: `fixes #12`, `Closes: #3`. */
const CLOSING_REFERENCE = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?):?\s+#(\d+)\b/gi;

/** The `#N` words at a line's end, after its text: ` #147 #139`. */
export const TRAILING_ISSUES = /(?: #\d+)+$/;

/** An issue's number (group 1) where it's named: `#147`. */
export const ISSUE = /#(\d+)/g;

export const CHANGELOG_FILE = "CHANGELOG.md";

/** What a line can say it did, its first word after the date. */
export const VERBS = ["Added", "Changed", "Fixed", "Removed"] as const;
export type Verb = (typeof VERBS)[number];

/** A changelog line in format opens with its date (group 1). */
export const DATED_LINE = /^- (\d{4}-\d{2}-\d{2}) /;

/** A changelog line as it must open: its date, then what it did (group 2). */
const LINE_FORMAT = new RegExp(`${DATED_LINE.source}(${VERBS.join("|")}) `);

/** A released version's heading, `## 0.2.10 (2017-04-02)`; the lines above the first are unreleased. */
const VERSION_HEADING = /^## \d/;

/** A pre-release's heading, `## 1.1.0-rc.1 (2026-10-20)`: its lines ship again in the release. */
const PRERELEASE_HEADING = /^## \d+\.\d+\.\d+-/;

/** The issues a commit message closes, as GitHub reads it. */
export function issuesClosedBy(message: string): number[] {
  return Array.from(message.matchAll(CLOSING_REFERENCE), ([, issue]) => Number(issue));
}

/** The issues named at the end of `lines`: the `#N` words after their text. */
export function issuesNamedIn(lines: readonly string[]): Set<number> {
  return new Set(lines.flatMap(trailingIssues));
}

function trailingIssues(line: string): number[] {
  const issues = TRAILING_ISSUES.exec(line)?.[0] ?? "";
  return Array.from(issues.matchAll(ISSUE), ([, issue]) => Number(issue));
}

/** The changelog's list lines, released or not. */
export function listLines(changelog: string): string[] {
  return changelog.split("\n").filter(isListLine);
}

/** Each list line out of format, as `line N: …`. */
export function malformedLines(changelog: string): string[] {
  return changelog
    .split("\n")
    .flatMap((line, index) =>
      isListLine(line) && !LINE_FORMAT.test(line) ? [`line ${index + 1}: ${line}`] : [],
    );
}

/** What a line in format says it did. */
export function verbOf(line: string): Verb | undefined {
  return LINE_FORMAT.exec(line)?.[2] as Verb | undefined;
}

/**
 * Where a changelog's lines start, past its title and intro: its first list line or version
 * heading, or its end when it has neither.
 */
export function preambleEnd(lines: readonly string[]): number {
  const start = lines.findIndex((line) => isListLine(line) || isVersionHeading(line));
  return start === -1 ? lines.length : start;
}

export function isListLine(line: string): boolean {
  return line.startsWith("- ");
}

/** A release's heading: `## 1.1.0 (2026-10-21)`. */
export function releaseHeading(version: string, date: string): string {
  return `${headingPrefix(version)}${date})`;
}

export function isHeadingOf(version: string, line: string): boolean {
  return line.startsWith(headingPrefix(version));
}

export function isVersionHeading(line: string): boolean {
  return VERSION_HEADING.test(line);
}

/** `lines` up to the first version heading among them. */
export function untilNextHeading(lines: readonly string[]): readonly string[] {
  return untilFirst(lines, isVersionHeading);
}

/** `lines` up to the first stable version's heading among them, past any pre-release's. */
export function untilNextStableHeading(lines: readonly string[]): readonly string[] {
  return untilFirst(lines, (line) => isVersionHeading(line) && !PRERELEASE_HEADING.test(line));
}

function headingPrefix(version: string): string {
  return `## ${version} (`;
}

function untilFirst(lines: readonly string[], isEnd: (line: string) => boolean): readonly string[] {
  const end = lines.findIndex(isEnd);
  return end === -1 ? lines : lines.slice(0, end);
}

/** A GitHub closing keyword with this repo's issue: `fixes #12`, `Closes: #3`. */
const CLOSING_REFERENCE = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?):?\s+#(\d+)\b/gi;

/** An issue named as a word of a changelog line: `#147`. */
const ISSUE_WORD = /^#(\d+)$/;

export const CHANGELOG_FILE = "CHANGELOG.md";

/** What a line can say it did, its first word after the date. */
export const VERBS = ["Added", "Changed", "Fixed", "Removed"] as const;
export type Verb = (typeof VERBS)[number];

/** A changelog line as it must open: `- YYYY-MM-DD`, then what it did (group 1). */
const LINE_FORMAT = new RegExp(String.raw`^- \d{4}-\d{2}-\d{2} (${VERBS.join("|")}) `);

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
  const issues: number[] = [];
  for (const word of line.split(" ").reverse()) {
    const issue = ISSUE_WORD.exec(word);
    if (issue === null) break;
    issues.push(Number(issue[1]));
  }
  return issues;
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
  return LINE_FORMAT.exec(line)?.[1] as Verb | undefined;
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

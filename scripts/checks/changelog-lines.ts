/** A GitHub closing keyword with this repo's issue: `fixes #12`, `Closes: #3`. */
const CLOSING_REFERENCE = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?):?\s+#(\d+)\b/gi;

/** An issue named as a word of a changelog line: `#147`. */
const ISSUE_WORD = /^#(\d+)$/;

/** A changelog line, as it must be dated: `- YYYY-MM-DD …`. */
const DATED_LINE = /^- \d{4}-\d{2}-\d{2} /;

/** A released version's heading, `## 0.2.10 (2017-04-02)`; the lines above the first are unreleased. */
const VERSION_HEADING = /^## \d/;

/** The issues a commit message closes, as GitHub reads it. */
export function issuesClosedBy(message: string): number[] {
  return Array.from(message.matchAll(CLOSING_REFERENCE), ([, issue]) => Number(issue));
}

/** The changelog lines above the first version heading: what the next release brings. */
export function unreleasedLines(changelog: string): string[] {
  const lines = changelog.split("\n");
  const firstRelease = lines.findIndex((line) => VERSION_HEADING.test(line));
  return lines.slice(0, firstRelease === -1 ? lines.length : firstRelease).filter(isListLine);
}

/** The changelog's list lines, released or not. */
export function listLines(changelog: string): string[] {
  return changelog.split("\n").filter(isListLine);
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

/** Each list line without its date, as `line N: …`. */
export function undatedLines(changelog: string): string[] {
  return changelog
    .split("\n")
    .flatMap((line, index) =>
      isListLine(line) && !DATED_LINE.test(line) ? [`line ${index + 1}: ${line}`] : [],
    );
}

function isListLine(line: string): boolean {
  return line.startsWith("- ");
}

import { describe, expect, it } from "vitest";
import { issuesClosedBy, issuesNamedIn, undatedLines, unreleasedLines } from "./changelog-lines.ts";

const CHANGELOG = `# Changelog

Newest first.

- 2026-10-20 Fixed the list's focus after a reorder #12
- 2026-10-16 Changed everything: maplace 1.0

## 0.2.10 (2017-04-02)

- 2017-04-02 Fixed afterRoute with draggable routes #147 #139
`;

describe("issuesClosedBy", () => {
  it("reads every GitHub closing keyword, any case, with or without a colon", () => {
    const keywords = [
      "close",
      "closes",
      "closed",
      "fix",
      "fixes",
      "fixed",
      "resolve",
      "resolves",
      "resolved",
    ];
    keywords.forEach((keyword, index) => {
      expect(issuesClosedBy(`[upd] something\n\n${keyword.toUpperCase()} #${index}`)).toEqual([
        index,
      ]);
    });
    expect(issuesClosedBy("Fixes: #7, closes #8")).toEqual([7, 8]);
  });

  it("ignores the [fix] prefix, mentions, and another repo's issues", () => {
    expect(issuesClosedBy("[fix] G7: see #3 and fixes owner/repo#4")).toEqual([]);
    expect(issuesClosedBy("prefix #5; postfix #6")).toEqual([]);
  });
});

describe("unreleasedLines", () => {
  it("are the lines above the first version heading", () => {
    expect(unreleasedLines(CHANGELOG)).toEqual([
      "- 2026-10-20 Fixed the list's focus after a reorder #12",
      "- 2026-10-16 Changed everything: maplace 1.0",
    ]);
  });
});

describe("issuesNamedIn", () => {
  it("reads the issues at each line's end, not those in its text", () => {
    expect(
      issuesNamedIn(["- 2017-04-02 Fixed #1 in prose, afterRoute #147 #139", "- 2026-10-16 none"]),
    ).toEqual(new Set([147, 139]));
  });
});

describe("undatedLines", () => {
  it("names each list line without its date, by line number", () => {
    expect(undatedLines(`${CHANGELOG}- Fixed something\n- 2017-4-2 Short date\n`)).toEqual([
      "line 11: - Fixed something",
      "line 12: - 2017-4-2 Short date",
    ]);
  });
});

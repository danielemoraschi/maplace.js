import { describe, expect, it } from "vitest";
import {
  issuesClosedBy,
  issuesNamedIn,
  malformedLines,
  preambleEnd,
  verbOf,
} from "./changelog-lines.ts";

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

describe("issuesNamedIn", () => {
  it("reads the issues at each line's end, not those in its text", () => {
    expect(
      issuesNamedIn(["- 2017-04-02 Fixed #1 in prose, afterRoute #147 #139", "- 2026-10-16 none"]),
    ).toEqual(new Set([147, 139]));
  });
});

describe("malformedLines", () => {
  it("names each list line without its date or its verb, by line number", () => {
    const lines =
      "- Fixed something\n- 2017-4-2 Fixed a short date\n- 2026-10-16 Tweaked a thing\n";
    expect(malformedLines(`${CHANGELOG}${lines}`)).toEqual([
      "line 11: - Fixed something",
      "line 12: - 2017-4-2 Fixed a short date",
      "line 13: - 2026-10-16 Tweaked a thing",
    ]);
  });

  it("passes each of the four verbs", () => {
    const lines = ["Added", "Changed", "Fixed", "Removed"].map((verb) => `- 2026-10-16 ${verb} x`);
    expect(malformedLines(lines.join("\n"))).toEqual([]);
  });
});

describe("verbOf", () => {
  it("is the word after a line's date", () => {
    expect(verbOf("- 2026-10-16 Removed the old menu #3")).toBe("Removed");
  });
});

describe("preambleEnd", () => {
  it("is the first list line, past the title and intro", () => {
    expect(preambleEnd(CHANGELOG.split("\n"))).toBe(4);
  });

  it("is the first version heading when no line is unreleased", () => {
    expect(preambleEnd(["# Changelog", "", "## 0.2.10 (2017-04-02)"])).toBe(2);
  });

  it("is the end of a changelog with neither", () => {
    expect(preambleEnd(["# Changelog", "", "Newest first."])).toBe(3);
  });
});

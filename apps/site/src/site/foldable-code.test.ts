import { describe, expect, it } from "vitest";
import { FOLD_FROM_LINES, foldableCode, foldMarks } from "./foldable-code.ts";

const linesOf = (count: number) => Array.from({ length: count }, (_, n) => `line ${n}`).join("\n");

describe("foldMarks", () => {
  it("marks a block of FOLD_FROM_LINES lines or more as foldable, with its lines", () => {
    expect(foldMarks(`${linesOf(FOLD_FROM_LINES)}\n`)).toEqual({
      "data-lines": String(FOLD_FROM_LINES),
      "data-foldable": "",
    });
  });

  it("leaves a shorter block unmarked", () => {
    expect(foldMarks(linesOf(FOLD_FROM_LINES - 1))).toEqual({});
  });
});

describe("foldableCode", () => {
  it("marks the pre Shiki renders from its source", () => {
    const node = { properties: { class: "astro-code" } as Record<string, unknown> };
    foldableCode.pre.call({ source: linesOf(20) }, node);
    expect(node.properties).toEqual({
      class: "astro-code",
      "data-lines": "20",
      "data-foldable": "",
    });
  });
});

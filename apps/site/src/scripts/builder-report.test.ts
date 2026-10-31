import { describe, expect, it } from "vitest";
import { createReport } from "./builder-report.ts";

describe("createReport", () => {
  it("keeps a name's first note, in the order they came", () => {
    const report = createReport();
    report.note("b", "first");
    report.note("a", "only");
    report.note("b", "second");
    expect(report.notes()).toEqual([
      { name: "b", says: "first" },
      { name: "a", says: "only" },
    ]);
  });
});

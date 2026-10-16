import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "../build/package.ts";
import { type CoverageSummary, check, coreSourceFiles, coverageReport } from "./coverage.ts";

const CORE_FILE = "packages/maplace/src/maplace/create.ts";
const GOOGLE_FILE = "packages/maplace/src/google/camera.ts";
const SCRIPT_FILE = "scripts/checks/sizes.ts";
const FLOORS = { core: 95, package: 85 };

/** A summary as Vitest writes it: absolute paths, each file's lines, and a total. */
function summary(lines: Record<string, [covered: number, total: number]>): CoverageSummary {
  const files = Object.entries(lines).map(([file, [covered, total]]) => [
    join(ROOT, file),
    { lines: { covered, total } },
  ]);
  return Object.fromEntries([...files, ["total", { lines: { covered: 0, total: 0 } }]]);
}

describe("coverageReport", () => {
  it("counts the core's files for the core, and the package's for the package, not scripts'", () => {
    const report = coverageReport(
      summary({ [CORE_FILE]: [9, 10], [GOOGLE_FILE]: [1, 10], [SCRIPT_FILE]: [0, 80] }),
      new Set([CORE_FILE]),
    );
    expect(report).toEqual({ shares: { core: 90, package: 50 }, missingCoreFiles: [] });
  });
});

describe("check", () => {
  const core = new Set([CORE_FILE]);

  it("passes coverage at or over each floor", () => {
    expect(
      check(
        coverageReport(summary({ [CORE_FILE]: [95, 100], [GOOGLE_FILE]: [75, 100] }), core),
        FLOORS,
      ),
    ).toEqual([]);
  });

  it("names each share under its floor", () => {
    expect(
      check(
        coverageReport(summary({ [CORE_FILE]: [94, 100], [GOOGLE_FILE]: [10, 100] }), core),
        FLOORS,
      ),
    ).toEqual([
      "core: 94.00% of lines covered, under its 95% floor",
      "package: 52.00% of lines covered, under its 85% floor",
    ]);
  });

  it("names a core file the report doesn't have", () => {
    expect(check(coverageReport(summary({ [GOOGLE_FILE]: [10, 10] }), core), FLOORS)).toEqual([
      `${CORE_FILE}: a core file not in the coverage report`,
      "core: 0.00% of lines covered, under its 95% floor",
    ]);
  });
  it("fails a share with no lines measured: an empty core is no coverage", () => {
    expect(check(coverageReport(summary({ [GOOGLE_FILE]: [10, 10] }), new Set()), FLOORS)).toEqual([
      "core: 0.00% of lines covered, under its 95% floor",
    ]);
  });
});

describe("coreSourceFiles", () => {
  it("are the files a page importing maplace loads: the store and list view, no adapter or element", async () => {
    const files = [...(await coreSourceFiles())];
    expect(files).toContain(CORE_FILE);
    expect(files).toContain("packages/maplace/src/list-view.ts");
    expect(files.filter((file) => /\/src\/(google|element|adapter-kit)\//.test(file))).toEqual([]);
  });
});

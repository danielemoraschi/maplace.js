import { relative } from "node:path";
import type { Metafile } from "esbuild";
import { esmBuildOptions } from "../build/esm-build.ts";
import { PACKAGE_ENTRIES, ROOT, SRC } from "../build/package.ts";
import { bundleInMemory, reachableOutputs } from "./in-memory-bundle.ts";
import type { CoverageFloors } from "./rfc-numbers.ts";

/** Vitest's `json-summary` report: each file's lines by absolute path, and their `total`. */
export type CoverageSummary = Readonly<
  Record<string, { readonly lines: { readonly covered: number; readonly total: number } }>
>;

/** The share of lines covered, in %: the core entry's files, and the package's. */
export type CoverageShares = CoverageFloors;

/** The source files a page importing `maplace` loads, relative to the repo, as the report's. */
export async function coreSourceFiles(): Promise<Set<string>> {
  const { metafile } = await bundleInMemory(esmBuildOptions());
  return sourcesOf(metafile, reachableOutputs(metafile, PACKAGE_ENTRIES.core));
}

/** What a coverage report says of the core and the package. */
export interface CoverageReport {
  readonly shares: CoverageShares;
  /** Core files the report doesn't have: they would leave the core's share unmeasured. */
  readonly missingCoreFiles: readonly string[];
}

/** The core's and the package's coverage in `summary`, `core` naming the core's files. */
export function coverageReport(
  summary: CoverageSummary,
  core: ReadonlySet<string>,
): CoverageReport {
  const reported = new Set(filesIn(summary).map(([file]) => file));
  return {
    shares: {
      core: linesCovered(summary, (file) => core.has(file)),
      package: linesCovered(summary, (file) => file.startsWith(`${SRC}/`)),
    },
    missingCoreFiles: [...core].filter((file) => !reported.has(file)),
  };
}

/** Each share under its RFC floor, and each core file the report doesn't have. */
export function check(
  { shares, missingCoreFiles }: CoverageReport,
  floors: CoverageFloors,
): string[] {
  return [
    ...missingCoreFiles.map((file) => `${file}: a core file not in the coverage report`),
    ...(["core", "package"] as const).flatMap((share) =>
      shares[share] < floors[share]
        ? [
            `${share}: ${shares[share].toFixed(2)}% of lines covered, under its ${floors[share]}% floor`,
          ]
        : [],
    ),
  ];
}

/** Lines covered, in %, over the reported files that `counts`; none measured is none covered. */
function linesCovered(summary: CoverageSummary, counts: (file: string) => boolean): number {
  let covered = 0;
  let total = 0;
  for (const [file, { lines }] of filesIn(summary)) {
    if (!counts(file)) continue;
    covered += lines.covered;
    total += lines.total;
  }
  return total === 0 ? 0 : (100 * covered) / total;
}

/** The report's files, by path relative to the repo, without its `total`. */
function filesIn(summary: CoverageSummary) {
  return Object.entries(summary)
    .filter(([path]) => path !== "total")
    .map(([path, file]) => [relative(ROOT, path), file] as const);
}

/** The source files `outputs` were bundled from. */
function sourcesOf(metafile: Metafile, outputs: Iterable<string>): Set<string> {
  return new Set(
    [...outputs].flatMap((output) => Object.keys(metafile.outputs[output]?.inputs ?? {})),
  );
}

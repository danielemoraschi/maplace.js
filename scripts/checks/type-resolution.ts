import { checkPackage } from "@arethetypeswrong/core";
import type { Problem, ResolutionKind } from "@arethetypeswrong/core/types";
import { packageIn } from "./packed-files.ts";

/**
 * Resolutions attw's `esm-only` profile leaves out: the package is ES modules only (RFC §3), so
 * CommonJS consumers and pre-`exports` resolution are not served.
 */
const ESM_ONLY_IGNORED: ReadonlySet<ResolutionKind> = new Set(["node10", "node16-cjs"]);

/** What attw finds wrong with how each entry's types resolve, for every resolution served. */
export async function typeResolutionProblems(tarball: string): Promise<string[]> {
  const analysis = await checkPackage(packageIn(tarball));
  if (!("problems" in analysis)) return [`${tarball} has no types for attw to check`];
  return analysis.problems.filter((problem) => !isIgnored(problem)).map(problemText);
}

function isIgnored(problem: Problem): boolean {
  return "resolutionKind" in problem && ESM_ONLY_IGNORED.has(problem.resolutionKind);
}

function problemText(problem: Problem): string {
  const { kind, ...where } = problem;
  return `${kind}: ${JSON.stringify(where)}`;
}

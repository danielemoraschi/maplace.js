import { gitIn } from "../../../../scripts/build/git.ts";
import { ROOT } from "../../../../scripts/build/package.ts";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today in the local calendar, as `YYYY-MM-DD`. */
const today = () => new Date().toLocaleDateString("en-CA");

/**
 * The day `paths` last changed: today while any of them has uncommitted edits, else the author
 * date of the last commit touching them, which a rebase keeps.
 */
export function lastChangeOf(paths: readonly string[]): string {
  if (gitIn(ROOT, ["status", "--porcelain", "--", ...paths]).trim() !== "") return today();
  const date = gitIn(ROOT, ["log", "-1", "--format=%as", "--", ...paths]).trim();
  if (!ISO_DATE.test(date)) throw new Error(`git gave no date for ${paths.join(", ")}`);
  return date;
}

import { describe, expect, it } from "vitest";
import { gitIn } from "../../../../scripts/build/git.ts";
import { ROOT } from "../../../../scripts/build/package.ts";
import { PRIVACY_CHANGED_ON } from "./privacy-changed-on.ts";

/** What the privacy page says: the page, and who runs the site, which it alone reads. */
const PAGE_SOURCES = ["apps/site/src/pages/privacy.astro", "apps/site/src/site/site-owner.ts"];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today in the local calendar, as `YYYY-MM-DD`. */
const today = () => new Date().toLocaleDateString("en-CA");

/**
 * The day `paths` last changed: today while any of them has uncommitted edits, else the author
 * date of the last commit touching them, which a rebase keeps.
 */
function lastChangeOf(paths: readonly string[]): string {
  if (gitIn(ROOT, ["status", "--porcelain", "--", ...paths]).trim() !== "") return today();
  const date = gitIn(ROOT, ["log", "-1", "--format=%as", "--", ...paths]).trim();
  if (!ISO_DATE.test(date)) throw new Error(`git gave no date for ${paths.join(", ")}`);
  return date;
}

describe("PRIVACY_CHANGED_ON", () => {
  it("is the day what the privacy page says last changed, committed or not", () => {
    const changed = lastChangeOf(PAGE_SOURCES);
    expect(
      PRIVACY_CHANGED_ON,
      `${PAGE_SOURCES.join(", ")} last changed on ${changed}: set PRIVACY_CHANGED_ON to it`,
    ).toBe(changed);
  });
});

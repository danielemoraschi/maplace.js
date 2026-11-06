/** The year 1.0's code was written, where its copyright starts: a rewrite, it carries none of 0.x's. */
const FIRST_COPYRIGHT_YEAR = 2026;

/** The copyright years the footer shows in `year`: the first year alone, then a range up to `year`. */
export function copyrightYears(year: number): string {
  return year > FIRST_COPYRIGHT_YEAR
    ? `${FIRST_COPYRIGHT_YEAR}–${year}`
    : `${FIRST_COPYRIGHT_YEAR}`;
}

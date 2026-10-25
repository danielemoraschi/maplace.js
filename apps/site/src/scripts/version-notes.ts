/**
 * A version's notes (loading, failed, saved): the site's own markup, right after the version in
 * its frame (`MapFrame.astro`), outside the example's, which the site's rules for an example's
 * nodes would restyle. Shown only while the version is (`frame.css`).
 */

/** The notes of the version shown, in each frame. */
export const SHOWN_NOTES = ".version:not([hidden]) + [data-version-notes]";

/**
 * The notes of `version`: the frame writes them after every version, so a version without them
 * is a bug in the site, and it throws.
 */
export function notesOf(version: HTMLElement): HTMLElement {
  const notes = version.nextElementSibling;
  if (!(notes instanceof HTMLElement && notes.matches("[data-version-notes]"))) {
    throw new Error(
      `the ${version.dataset.liveVersion ?? "unnamed"} version has no notes after it`,
    );
  }
  return notes;
}

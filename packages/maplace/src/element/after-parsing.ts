/**
 * Runs `run` once `document`'s children are in: after its parser finished, or, past that, after
 * this task's custom element upgrades. A map connects before the locations inside it are parsed
 * (or upgraded, from `innerHTML`), and its first view and `selected-id` need them all.
 */
export function afterParsing(document: Document, run: () => void): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    queueMicrotask(run);
  }
}

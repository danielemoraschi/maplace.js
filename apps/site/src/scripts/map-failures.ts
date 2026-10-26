import type { MaplaceElementEventMap } from "maplace/element";
import { providerOf, versionOf } from "./by-provider.ts";
import { versionFailureNote } from "./failure-words.ts";
import {
  type FailureName,
  failureName,
  type MapFailure,
  NOT_LOADED,
  type VersionFailure,
} from "./version-failures.ts";
import { notesOf } from "./version-notes.ts";

/**
 * Shows that `map`'s script didn't load. The element isn't defined then, so it has no error state
 * to show the note by: the map's version is marked instead, as a version that didn't start is.
 */
export function noteScriptFailure(map: Element): void {
  noteVersionFailure(versionOf(map), "script");
}

/** The script loaded after all: the note goes. */
export function clearScriptFailure(map: Element): void {
  const version = versionOf(map);
  delete version.dataset.failed;
  delete version.dataset.reloadMends;
}

/**
 * The failures a reload mends, what didn't load being fetched again: the site's script or the
 * version's module (the browser keeps a failed import's failure until then; a module that threw
 * throws again, harmlessly), Maps JS (`watchMapsJs` keeps its failure), a provider's map. Not a
 * missing or refused key, nor a program's throw.
 */
const MENDED_BY_RELOAD: ReadonlySet<FailureName> = new Set<FailureName>([
  "script",
  "module",
  "provider-load-failed",
]);

/** Shows why `version` didn't start, in its own note, shown while the version is. */
export function noteVersionFailure(version: HTMLElement, failure: VersionFailure): void {
  writeFailure(version, failure);
  version.dataset.failed = failureName(failure);
}

/**
 * Shows why `version` didn't start, unless it failed already (its map, say, while its start
 * waited): the first failure is the one that says why.
 */
export function noteVersionStartFailure(version: HTMLElement, failure: VersionFailure): void {
  if (version.dataset.failed === undefined) noteVersionFailure(version, failure);
}

/** Marks `version` for its note's reload button (`frame.css`) when a reload mends `failure`. */
function offerReloadIfMends(version: HTMLElement, failure: FailureName): void {
  version.toggleAttribute("data-reload-mends", MENDED_BY_RELOAD.has(failure));
}

/** A Google version that started, or is starting, and hasn't failed yet. */
const RUNNING_GOOGLE_VERSION =
  '[data-provider="google"]:is([data-started], [data-starting]):not([data-failed])';

/**
 * Shows that Maps JS didn't load for each Google version in `root` that is running. A version's
 * bootstrap adds its Maps tag as the version starts (`askBootstrapForMapsJs`), so Maps JS may
 * fail while the version starts or after.
 */
export function noteMapsJsFailure(root: ParentNode): void {
  for (const version of root.querySelectorAll<HTMLElement>(RUNNING_GOOGLE_VERSION)) {
    noteVersionFailure(version, NOT_LOADED);
  }
}

/** Each map's `maplace-error` written into its version's note. */
export function startFailureNotes(maps: readonly HTMLElement[]): void {
  for (const map of maps) {
    map.addEventListener("maplace-error", (event) => {
      const { error } = (event as MaplaceElementEventMap["maplace-error"]).detail;
      writeFailure(versionOf(map), error);
    });
  }
}

/**
 * Shows that the map of the version `element` is in didn't load, in that version's note, in the
 * words a page map's failure gets, its `data-failed` the error's code. A version that failed
 * already keeps its first note.
 */
export function noteVersionMapFailure(element: Element, failure: MapFailure): void {
  noteVersionStartFailure(versionOf(element), failure);
}

/** Writes why `version` failed into its note, offering a reload when one mends it. */
function writeFailure(version: HTMLElement, failure: VersionFailure): void {
  noteFailure(version, versionFailureNote(failure, providerOf(version)));
  offerReloadIfMends(version, failureName(failure));
}

/** Writes `note` in `version`'s own failure note, which shows while the version does (`frame.css`). */
function noteFailure(version: HTMLElement, note: string): void {
  const failureText = notesOf(version).querySelector("[data-map-failure]");
  if (failureText === null) {
    const { liveVersion, provider } = version.dataset;
    throw new Error(`the ${provider} ${liveVersion} version's notes have no failure note`);
  }
  failureText.textContent = note;
}

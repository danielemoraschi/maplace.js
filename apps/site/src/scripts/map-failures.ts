import type { MaplaceError } from "maplace";
import type { MaplaceElementEventMap } from "maplace/element";
import type { Provider } from "../examples/example-providers.ts";
import { providerOf, versionOf } from "./by-provider.ts";
import {
  type CodeFailure,
  type FailureName,
  failureName,
  isCodeFailure,
  type MapFailure,
  NOT_LOADED,
  type VersionFailure,
} from "./version-failures.ts";

const NOTE = "The map couldn't load";

/** Why a map didn't load, by its error's code, on each provider: the visitor's words. */
const REASONS: Readonly<Record<Provider, Partial<Record<MaplaceError["code"], string>>>> = {
  google: {
    "provider-auth-failed": "Google refused this site's key.",
    "provider-load-failed": "Google Maps didn't load. A blocker, or the network?",
  },
  maplibre: {
    "provider-auth-failed": "OpenFreeMap refused the map's style.",
    "provider-load-failed": "OpenFreeMap's map didn't load. A blocker, or the network?",
  },
};

/** Why a map on `provider` didn't load, for the visitor; the element's message is the developer's. */
function reasonFor({ code, field }: MapFailure, provider: Provider): string | undefined {
  if (field === "api-key" && provider === "google") return "this site has no Google Maps key.";
  return REASONS[provider][code];
}

/** The note a frame shows for a map on `provider` that failed. */
export function failureNote(failure: MapFailure, provider: Provider): string {
  const reason = reasonFor(failure, provider);
  return reason === undefined ? `${NOTE}.` : `${NOTE}: ${reason}`;
}

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
  delete version.dataset.failureNote;
  delete version.dataset.reloadMends;
}

/** The note for each reason a version's own code didn't run (`CodeFailure`). */
const CODE_FAILURES: Readonly<Record<CodeFailure, string>> = {
  script: `${NOTE}: its script didn't load. The network?`,
  module: `${NOTE}: its code didn't load or run.`,
  program: `${NOTE}: its program threw an error as it ran.`,
};

/** The note for a version on `provider` that didn't start: its readying's, or its code's. */
function versionFailureNote(failure: VersionFailure, provider: Provider): string {
  return isCodeFailure(failure) ? CODE_FAILURES[failure] : failureNote(failure, provider);
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

/** Shows why `version` didn't start, in its frame's note, shown while the version is. */
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
 * bootstrap adds its Maps tag only once its module asks for a library, so Maps JS fails after
 * the version started.
 */
export function noteMapsJsFailure(root: ParentNode): void {
  for (const version of root.querySelectorAll<HTMLElement>(RUNNING_GOOGLE_VERSION)) {
    noteVersionFailure(version, NOT_LOADED);
  }
}

/** Each map's `maplace-error` written into its frame's note. */
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

/**
 * Writes the note `version` kept, if any, into its frame's one `[data-map-failure]`: as the
 * version is shown, so the note is always the shown version's.
 */
export function showFailureNoteOf(version: HTMLElement): void {
  const note = version.dataset.failureNote;
  const shown = version.closest(".map-frame")?.querySelector("[data-map-failure]");
  if (note !== undefined && shown) shown.textContent = note;
}

/** Keeps `note` on `version`, and shows it in the frame's note while the version is shown. */
function noteFailure(version: HTMLElement, note: string): void {
  version.dataset.failureNote = note;
  if (!version.hidden) showFailureNoteOf(version);
}

import type { MaplaceError } from "maplace";
import type { MaplaceElementEventMap } from "maplace/element";
import type { Provider } from "../examples/example-providers.ts";
import { providerOf, versionOf } from "./by-provider.ts";
import type { VersionFailure } from "./version-start.ts";

/** As much of a map's error as the note reads. */
type MapFailure = Pick<MaplaceError, "code"> & Partial<Pick<MaplaceError, "field">>;

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
  if (field === "api-key") return "this site has no Google Maps key.";
  return REASONS[provider][code];
}

/** The note a frame shows for a map on `provider` that failed. */
export function failureNote(failure: MapFailure, provider: Provider): string {
  const reason = reasonFor(failure, provider);
  return reason === undefined ? `${NOTE}.` : `${NOTE}: ${reason}`;
}

/** The note for a map whose own script, the site's element, didn't load. */
const SCRIPT_FAILURE = `${NOTE}: its script didn't load. The network?`;

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
}

/** The note for each reason a vanilla or React version didn't start ("no-key", "maps-js": Google's). */
const VERSION_FAILURES: Readonly<Record<VersionFailure, string>> = {
  "no-key": failureNote({ code: "invalid-input", field: "api-key" }, "google"),
  "maps-js": failureNote({ code: "provider-load-failed" }, "google"),
  script: SCRIPT_FAILURE,
};

/** Shows why `version` didn't start, in its frame's note, shown while the version is. */
export function noteVersionFailure(version: HTMLElement, failure: VersionFailure): void {
  noteFailure(version, VERSION_FAILURES[failure]);
  version.dataset.failed = "";
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
    noteVersionFailure(version, "maps-js");
  }
}

/** Each map's `maplace-error` written into its frame's note. */
export function startFailureNotes(maps: readonly HTMLElement[]): void {
  for (const map of maps) {
    map.addEventListener("maplace-error", (event) => {
      const { error } = (event as MaplaceElementEventMap["maplace-error"]).detail;
      noteFailure(versionOf(map), failureNote(error, providerOf(map)));
    });
  }
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

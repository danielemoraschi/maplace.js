import type { MaplaceError } from "maplace";
import type { MaplaceElementEventMap } from "maplace/element";

/** As much of a map's error as the note reads. */
type MapFailure = Pick<MaplaceError, "code"> & Partial<Pick<MaplaceError, "field">>;

const NOTE = "The map couldn't load";

/** Why a map didn't load, for the visitor; the element's message is the developer's. */
function reasonFor({ code, field }: MapFailure): string | undefined {
  if (field === "api-key") return "this site has no Google Maps key.";
  if (code === "provider-auth-failed") return "Google refused this site's key.";
  if (code === "provider-load-failed") return "Google Maps didn't load. A blocker, or the network?";
  return undefined;
}

/** The note a frame shows for a map that failed. */
export function failureNote(failure: MapFailure): string {
  const reason = reasonFor(failure);
  return reason === undefined ? `${NOTE}.` : `${NOTE}: ${reason}`;
}

/** The note for a map whose own script, the site's element, didn't load. */
const SCRIPT_FAILURE = `${NOTE}: its script didn't load. The network?`;

/**
 * Shows that `map`'s script didn't load. The element isn't defined then, so it has no error state
 * to show the note by: the frame is marked instead.
 */
export function noteScriptFailure(map: Element): void {
  noteFailure(map, SCRIPT_FAILURE);
  map.closest(".map-frame")?.classList.add("script-failed");
}

/** The script loaded after all: the note goes. */
export function clearScriptFailure(map: Element): void {
  map.closest(".map-frame")?.classList.remove("script-failed");
}

/** Writes `note` into the `[data-map-failure]` note of `map`'s frame. */
function noteFailure(map: Element, note: string): void {
  const shown = map.closest(".map-frame")?.querySelector("[data-map-failure]");
  if (shown) shown.textContent = note;
}

/** Each map's `maplace-error` written into its frame's note. */
export function startFailureNotes(maps: readonly HTMLElement[]): void {
  for (const map of maps) {
    map.addEventListener("maplace-error", (event) => {
      const { error } = (event as MaplaceElementEventMap["maplace-error"]).detail;
      noteFailure(map, failureNote(error));
    });
  }
}

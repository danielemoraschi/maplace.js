import type { MaplaceError } from "maplace";

/** As much of a map's error as the note reads. */
export type MapFailure = Pick<MaplaceError, "code"> & Partial<Pick<MaplaceError, "field">>;

/** Maps JS, or a provider's map, that didn't load: as the element reports it. */
export const NOT_LOADED = { code: "provider-load-failed" } as const satisfies MapFailure;

/** A map with no key: as the element reports it. */
export const NO_KEY = { code: "invalid-input", field: "api-key" } as const satisfies MapFailure;

/**
 * Why a version's own code didn't run: the site's script it needs didn't load (a script
 * version's `Maplace`, maplibre-gl), its module didn't load or threw (an import can't tell
 * which), or its program threw as it ran.
 */
export type CodeFailure = "script" | "module" | "program";

/** Why a version didn't start: its provider's readying, as the element reports a map's, or its code. */
export type VersionFailure = MapFailure | CodeFailure;

/** What a failure is kept as (`data-failed`): a `CodeFailure`, or an error's code. */
export type FailureName = CodeFailure | MapFailure["code"];

/** Whether `failure` is the version's own code's, not its provider's. */
export function isCodeFailure(failure: VersionFailure): failure is CodeFailure {
  return typeof failure === "string";
}

/** What `data-failed` keeps of `failure`: its code, or its name. */
export function failureName(failure: VersionFailure): FailureName {
  return isCodeFailure(failure) ? failure : failure.code;
}

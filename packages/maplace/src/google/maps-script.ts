import { MaplaceError } from "../errors";
import { canImportLibraries } from "./libraries";
import { MAPS_SCRIPT_ORIGIN, type MapsScriptRequest, mapsScriptUrl } from "./maps-script-url";

/** Maps JS to add to a page: its settings, and the nonce a content security policy asks for. */
export interface MapsScriptLoad extends MapsScriptRequest {
  /** The nonce a content security policy asks the Maps JS tag for. */
  readonly nonce?: string | undefined;
}

/**
 * Set on a tag maplace added once it failed, so whatever asks later, another copy of maplace
 * too, fails at once rather than waiting for an `error` already fired.
 */
const FAILED = "data-maplace-maps-failed";

/**
 * How often to look for `importLibrary`: with `loading=async`, Maps JS defines it some time after
 * its tag loads, and the only signal is a callback by global name, which a second copy of
 * maplace, or the page's own tag, would not share.
 */
export const MAPS_READY_POLL_MS = 50;

/** The page's Maps JS tag, whoever added it. */
export function pageMapsScript(document: Document): HTMLScriptElement | null {
  return document.querySelector<HTMLScriptElement>(`script[src^="${MAPS_SCRIPT_ORIGIN}"]`);
}

/** Adds Maps JS to `document`, asynchronously, marking the tag if it fails. */
export function addMapsScript(load: MapsScriptLoad, document: Document): HTMLScriptElement {
  const script = document.createElement("script");
  script.src = mapsScriptUrl(load);
  script.async = true;
  if (load.nonce !== undefined) script.nonce = load.nonce;
  script.addEventListener("error", () => script.setAttribute(FAILED, ""), { once: true });
  document.head.append(script);
  return script;
}

/**
 * Resolves once Maps JS from `script` can import libraries; rejects with `provider-load-failed`
 * when the tag fails (a network error, or a content security policy refusing it).
 */
export function mapsReadyFrom(script: HTMLScriptElement): Promise<void> {
  let waiting = readyFrom.get(script);
  if (waiting === undefined) {
    waiting = script.hasAttribute(FAILED) ? Promise.reject(loadFailed()) : waitForMaps(script);
    // Each map that waits reports a failure; one that never waited (its attach refused) has
    // nothing to report it to.
    waiting.catch(() => {});
    readyFrom.set(script, waiting);
  }
  return waiting;
}

/** One wait per tag, however many maps share it. */
const readyFrom = new WeakMap<HTMLScriptElement, Promise<void>>();

function waitForMaps(script: HTMLScriptElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const ready = () => {
      if (!canImportLibraries()) return;
      stop();
      resolve();
    };
    const failed = () => {
      stop();
      reject(loadFailed());
    };
    const polling = setInterval(ready, MAPS_READY_POLL_MS);
    const stop = () => {
      clearInterval(polling);
      script.removeEventListener("error", failed);
    };
    script.addEventListener("error", failed);
    ready();
  });
}

function loadFailed(): MaplaceError {
  return new MaplaceError(
    "provider-load-failed",
    `Google Maps JS failed to load from ${MAPS_SCRIPT_ORIGIN}`,
  );
}

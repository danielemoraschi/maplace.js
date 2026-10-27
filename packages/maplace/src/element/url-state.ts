import type { Maplace } from "../index";
import { given, givenAttribute } from "./attribute-values";
import type { MaplaceElementEventMap } from "./index";
import { isShownIn, selectIfShown } from "./pending-selection";
import type { StoreFeed } from "./store-feed";

/** The query parameter a bare `url-state` names. */
const DEFAULT_PARAMETER = "location";

/** Keeps `<maplace-map>`'s selection and the page's address in step, while started. */
export interface UrlState {
  /**
   * With `url-state`: selects the location the address names once shown, then writes each
   * selection to the address and selects again on back and forward. A second start does nothing.
   */
  start(): void;
  stop(): void;
}

export function createUrlState(host: HTMLElement, feed: StoreFeed): UrlState {
  let running: AbortController | undefined;
  return {
    start() {
      const parameter = parameterOf(host.getAttribute("url-state"));
      if (running !== undefined || parameter === undefined) return;
      running = new AbortController();
      followAddress(host, feed, parameter, running.signal);
    },
    stop() {
      running?.abort();
      running = undefined;
    },
  };
}

/**
 * Selects the address's location, then, until `signal` aborts, writes each selection and selects
 * again when back or forward change this map's parameter: only then, so a hash link or another
 * map's entry neither moves nor clears this one.
 */
function followAddress(
  host: HTMLElement,
  feed: StoreFeed,
  parameter: string,
  signal: AbortSignal,
): void {
  nameStartingSelection(host, feed, parameter);
  let lastId = idInAddress(parameter);
  if (lastId !== undefined) feed.selectOnceShown(lastId);
  host.addEventListener(
    "maplace-selectionchange",
    (event) => {
      lastId = selectedIdOf(event);
      writeSelection(parameter, lastId, feed.store());
    },
    { signal },
  );
  globalThis.addEventListener(
    "popstate",
    () => {
      const store = feed.created;
      const id = idInAddress(parameter);
      if (store === undefined || id === lastId) return;
      lastId = id;
      selectFromAddress(store, id);
    },
    { signal },
  );
}

/**
 * Writes `selected-id` into an address naming no location, replacing the entry, before the store
 * exists: so the address always says what is selected, and absent means nothing is.
 */
function nameStartingSelection(host: HTMLElement, feed: StoreFeed, parameter: string): void {
  const id = givenAttribute(host, "selected-id");
  if (feed.created !== undefined || id === undefined || idInAddress(parameter) !== undefined)
    return;
  writeAddress("replaceState", addressWith(parameter, id));
}

/**
 * A new history entry for the selection, unless the address already names it; a selection
 * cleared because the page took its location away replaces the entry, as back to it would select
 * nothing.
 */
function writeSelection(parameter: string, id: string | undefined, store: Maplace): void {
  const named = idInAddress(parameter);
  if (named === id) return;
  const address = addressWith(parameter, id);
  const takenAway = id === undefined && named !== undefined && !isShownIn(store, named);
  writeAddress(takenAway ? "replaceState" : "pushState", address);
}

/**
 * Writes the page's address, keeping its history state. A document whose address can't change
 * (a srcdoc or blob frame), or a browser limiting history calls, refuses: the address is a
 * convenience, so the map goes on without it.
 */
function writeAddress(write: "pushState" | "replaceState", address: URL): void {
  try {
    history[write](history.state, "", address);
  } catch {
    // Refused: the selection stands, only the address doesn't follow it.
  }
}

/**
 * The page's address with `parameter` naming `id`, or without it; the rest of the query kept as
 * written, and the hash; in full, as a page's `<base>` may point elsewhere.
 */
function addressWith(parameter: string, id: string | undefined): URL {
  const entry = id === undefined ? [] : [new URLSearchParams({ [parameter]: id }).toString()];
  const pairs = location.search
    .slice(1)
    .split("&")
    .filter((pair) => pair !== "");
  const names = pairs.map(nameOf);
  const kept = pairs.filter((_, index) => names[index] !== parameter);
  const at = names.indexOf(parameter);
  kept.splice(at === -1 ? kept.length : at, 0, ...entry);
  const address = new URL(location.href);
  address.search = kept.join("&");
  return address;
}

function nameOf(pair: string): string | undefined {
  return new URLSearchParams(pair).keys().next().value;
}

function idInAddress(parameter: string): string | undefined {
  return given(new URLSearchParams(location.search).get(parameter));
}

/** Selects `id`, or clears the selection; an unknown or hidden id is ignored, as is no change. */
function selectFromAddress(store: Maplace, id: string | undefined): void {
  if (id === undefined) store.select(undefined);
  else selectIfShown(store, id);
}

/** The parameter `url-state` names: none without it, `location` when bare or `"true"`. */
function parameterOf(value: string | null): string | undefined {
  if (value === null) return undefined;
  return value === "" || value === "true" ? DEFAULT_PARAMETER : value;
}

function selectedIdOf(event: Event): string | undefined {
  return (event as MaplaceElementEventMap["maplace-selectionchange"]).detail.id;
}

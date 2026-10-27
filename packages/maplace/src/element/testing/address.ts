import { onTestFinished, vi } from "vitest";
import type { Location } from "../../index";
import { createStandingMisuse } from "../standing-misuse";
import { StoreFeed } from "../store-feed";
import { createUrlState } from "../url-state";
import { elementWith, errorsOn } from "./dom";

export const ROME_LOCATION: Location = { id: "rome", lat: 41.9, lng: 12.5 };
export const MILAN_LOCATION: Location = { id: "milan", lat: 45.46, lng: 9.19 };

/** A store feed on a host with `attributes`, given `locations`, its address sync not yet started. */
export function syncedFeed(
  attributes: Record<string, string>,
  locations = [ROME_LOCATION, MILAN_LOCATION],
) {
  const host = elementWith(attributes);
  const feed = new StoreFeed(
    host,
    createStandingMisuse(host, () => {}),
    () => {},
  );
  feed.giveLocations(locations);
  const sync = createUrlState(host, feed);
  onTestFinished(() => sync.stop());
  return { host, feed, sync, errors: errorsOn(host) };
}

/** The selection of `feed`'s store, created if it wasn't. */
export const selectedIn = (feed: StoreFeed) => feed.store().getSnapshot().selectedId;

/** The page's address with `query` and `hash`, until the test finishes. */
export function atAddress(query: string, hash = ""): void {
  const before = location.href;
  goTo(query, hash);
  onTestFinished(() => history.replaceState(null, "", before));
}

/** Back or forward to an address with `query` and `hash`, as the browser does it. */
export function popTo(query: string, hash = ""): void {
  goTo(query, hash);
  globalThis.dispatchEvent(new PopStateEvent("popstate"));
}

/** The page's address with `query` and `hash`, with no new entry and no event. */
export function goTo(query: string, hash = ""): void {
  history.replaceState(null, "", `${location.pathname}${query}${hash}`);
}

/** Spies on the history's writes, calling through, until the test finishes. */
export function historyWrites() {
  const pushes = vi.spyOn(history, "pushState");
  const replaces = vi.spyOn(history, "replaceState");
  onTestFinished(() => {
    pushes.mockRestore();
    replaces.mockRestore();
  });
  return { pushes, replaces };
}

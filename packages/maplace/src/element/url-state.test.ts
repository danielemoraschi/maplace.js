// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Location } from "../index";
import {
  atAddress,
  historyWrites,
  MILAN_LOCATION,
  popTo,
  ROME_LOCATION,
  selectedIn,
  syncedFeed,
} from "./testing/address";

const PARIS: Location = { id: "paris", lat: 48.85, lng: 2.35 };

describe("createUrlState, the address's selection", () => {
  it("selects the address's location once locations given later show it, without error", () => {
    atAddress("?location=milan");
    const { feed, sync, errors } = syncedFeed({ "url-state": "" }, []);
    sync.start();
    feed.store();
    expect(selectedIn(feed)).toBeUndefined();
    feed.giveLocations([ROME_LOCATION, MILAN_LOCATION]);
    expect([selectedIn(feed), errors]).toEqual(["milan", []]);
  });

  it("selects the address's location over selected-id", () => {
    atAddress("?location=milan");
    const { feed, sync } = syncedFeed({ "url-state": "", "selected-id": "rome" });
    sync.start();
    expect(selectedIn(feed)).toBe("milan");
  });

  it("takes selected-id when the address names a location the locations don't have, without error", () => {
    atAddress("?location=paris");
    const { feed, sync, errors } = syncedFeed({ "url-state": "", "selected-id": "rome" });
    sync.start();
    expect([selectedIn(feed), errors]).toEqual(["rome", []]);
  });

  it("drops the address's location once something else is selected first", () => {
    atAddress("?location=paris");
    const { feed, sync } = syncedFeed({ "url-state": "" });
    sync.start();
    feed.store().select("rome");
    feed.giveLocations([ROME_LOCATION, MILAN_LOCATION, PARIS]);
    expect(selectedIn(feed)).toBe("rome");
  });

  it("drops the address's location once selected-id's is selected, even when the locations later show it", () => {
    atAddress("?location=paris");
    const { feed, sync } = syncedFeed({ "url-state": "", "selected-id": "rome" });
    sync.start();
    feed.store();
    feed.giveLocations([ROME_LOCATION, MILAN_LOCATION, PARIS]);
    expect(selectedIn(feed)).toBe("rome");
  });

  it('reads a bare url-state, or "true" as Svelte 5 writes it, as the location parameter, and a value as its own', () => {
    atAddress("?location=milan&place=rome");
    const bare = syncedFeed({ "url-state": "" });
    const svelte = syncedFeed({ "url-state": "true" });
    const named = syncedFeed({ "url-state": "place" });
    for (const { sync } of [bare, svelte, named]) sync.start();
    expect([bare, svelte, named].map(({ feed }) => selectedIn(feed))).toEqual([
      "milan",
      "milan",
      "rome",
    ]);
  });

  it("never reads or writes the address without url-state", () => {
    atAddress("?location=milan");
    const { feed, sync } = syncedFeed({ "selected-id": "rome" });
    const { pushes, replaces } = historyWrites();
    sync.start();
    feed.store().select("milan");
    feed.store().select(undefined);
    expect([pushes.mock.calls, replaces.mock.calls]).toEqual([[], []]);
    popTo("?location=rome");
    expect(selectedIn(feed)).toBeUndefined();
  });
});

// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import type { Location } from "../index";
import {
  atAddress,
  historyWrites,
  popTo,
  ROME_LOCATION,
  selectedIn,
  syncedFeed,
} from "./testing/address";

const HIDDEN: Location = { id: "hidden", lat: 1, lng: 1, visible: false };

describe("createUrlState, back and forward", () => {
  it("selects the location a popstate's address names, pushing nothing", () => {
    atAddress("?location=rome");
    const { feed, sync } = syncedFeed({ "url-state": "" });
    sync.start();
    feed.store();
    const { pushes } = historyWrites();
    popTo("?location=milan");
    expect([selectedIn(feed), pushes.mock.calls]).toEqual(["milan", []]);
  });

  it("clears the selection on a popstate to an address without its parameter", () => {
    atAddress("?location=rome");
    const { feed, sync } = syncedFeed({ "url-state": "" });
    sync.start();
    feed.store();
    popTo("?page=2");
    expect(selectedIn(feed)).toBeUndefined();
  });

  it("ignores a popstate naming an unknown or hidden location, without error", () => {
    atAddress("?location=rome");
    const { feed, sync, errors } = syncedFeed({ "url-state": "" }, [ROME_LOCATION, HIDDEN]);
    sync.start();
    feed.store();
    popTo("?location=paris");
    popTo("?location=hidden");
    expect([selectedIn(feed), errors]).toEqual(["rome", []]);
  });

  it("ignores a popstate that leaves its parameter as it was: no pan, no clear", () => {
    atAddress("");
    const { feed, sync } = syncedFeed({ "url-state": "", "selected-id": "rome" });
    feed.store();
    sync.start();
    const select = vi.spyOn(feed.store(), "select");
    popTo("", "#section");
    popTo("?other=1");
    expect([selectedIn(feed), select.mock.calls]).toEqual(["rome", []]);
  });

  it("names its parameter with its value, so two maps keep their own", () => {
    atAddress("?office=rome&shop=milan");
    const office = syncedFeed({ "url-state": "office" });
    const shop = syncedFeed({ "url-state": "shop" });
    office.sync.start();
    shop.sync.start();
    shop.feed.store();
    office.feed.store().select("milan");
    popTo("?office=milan&shop=rome");
    expect([selectedIn(office.feed), selectedIn(shop.feed)]).toEqual(["milan", "rome"]);
    expect(location.search).toBe("?office=milan&shop=rome");
  });

  it("does nothing on a popstate before the store exists", () => {
    atAddress("?location=rome");
    const { feed, sync } = syncedFeed({ "url-state": "" });
    sync.start();
    popTo("?location=milan");
    expect(feed.created).toBeUndefined();
  });

  it("stops: a selection writes nothing and a popstate selects nothing", () => {
    atAddress("?location=rome");
    const { feed, sync } = syncedFeed({ "url-state": "" });
    sync.start();
    sync.stop();
    const { pushes } = historyWrites();
    feed.store().select("milan");
    popTo("?location=rome");
    expect([selectedIn(feed), pushes.mock.calls]).toEqual(["milan", []]);
  });
});

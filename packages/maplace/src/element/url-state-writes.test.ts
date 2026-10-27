// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished } from "vitest";
import {
  atAddress,
  goTo,
  historyWrites,
  MILAN_LOCATION,
  ROME_LOCATION,
  selectedIn,
  syncedFeed,
} from "./testing/address";

describe("createUrlState, selections written to the address", () => {
  it("pushes each selection, changing only its parameter and keeping the query and hash", () => {
    atAddress("?page=2", "#top");
    const { pushes } = historyWrites();
    const { feed, sync } = syncedFeed({ "url-state": "" });
    feed.store();
    sync.start();
    feed.store().select("rome");
    feed.store().select("milan");
    expect(pushes).toHaveBeenCalledTimes(2);
    expect(`${location.search}${location.hash}`).toBe("?page=2&location=milan#top");
  });

  it("writes the address in full, so a page's <base> elsewhere doesn't move it", () => {
    atAddress("?page=2");
    const base = document.createElement("base");
    base.href = "https://static.example.net/assets/";
    document.head.append(base);
    onTestFinished(() => base.remove());
    const { pushes, replaces } = historyWrites();
    const { feed, sync } = syncedFeed({ "url-state": "", "selected-id": "rome" });
    sync.start();
    feed.store().select("milan");
    const written = [...replaces.mock.calls, ...pushes.mock.calls].map(([, , url]) => String(url));
    expect(written).toEqual([
      new URL("?page=2&location=rome", location.href).href,
      new URL("?page=2&location=milan", location.href).href,
    ]);
  });

  it("selects all the same where the page's address can't be written (a srcdoc frame)", () => {
    atAddress("");
    const { pushes, replaces } = historyWrites();
    const refused = () => {
      throw new DOMException("can't rewrite this address", "SecurityError");
    };
    pushes.mockImplementation(refused);
    replaces.mockImplementation(refused);
    const { feed, sync } = syncedFeed({ "url-state": "", "selected-id": "rome" });
    sync.start();
    expect(() => feed.store().select("milan")).not.toThrow();
    expect([selectedIn(feed), replaces.mock.calls.length, pushes.mock.calls.length]).toEqual([
      "milan",
      1,
      1,
    ]);
  });

  it("keeps the rest of the query as written", () => {
    atAddress("?q=a%20b&debug");
    const { feed, sync } = syncedFeed({ "url-state": "" });
    feed.store();
    sync.start();
    feed.store().select("rome");
    const selected = location.search;
    feed.store().select(undefined);
    expect([selected, location.search]).toEqual(["?q=a%20b&debug&location=rome", "?q=a%20b&debug"]);
  });

  it("takes its parameter out in place when the page takes the selected location away", () => {
    atAddress("?location=rome");
    const { feed, sync } = syncedFeed({ "url-state": "" });
    sync.start();
    feed.store();
    const { pushes, replaces } = historyWrites();
    feed.giveLocations([MILAN_LOCATION]);
    expect([selectedIn(feed), location.search]).toEqual([undefined, ""]);
    expect([pushes.mock.calls.length, replaces.mock.calls.length]).toEqual([0, 1]);
  });

  it("takes its parameter out in place when a filter hides the selected location", () => {
    atAddress("?location=rome");
    const { feed, sync } = syncedFeed({ "url-state": "" }, [
      { ...ROME_LOCATION, group: "north" },
      { ...MILAN_LOCATION, group: "south" },
    ]);
    sync.start();
    feed.store();
    const { pushes, replaces } = historyWrites();
    feed.store().setFilter(["south"]);
    expect([selectedIn(feed), location.search]).toEqual([undefined, ""]);
    expect([pushes.mock.calls.length, replaces.mock.calls.length]).toEqual([0, 1]);
  });

  it("takes its parameter out when the selection is cleared", () => {
    atAddress("?location=rome&page=2");
    const { feed, sync } = syncedFeed({ "url-state": "" });
    sync.start();
    feed.store().select(undefined);
    expect(location.search).toBe("?page=2");
  });

  it("writes nothing for a selection the address already names", () => {
    atAddress("?location=rome");
    const { pushes, replaces } = historyWrites();
    const { feed, sync } = syncedFeed({ "url-state": "" });
    feed.store();
    sync.start();
    feed.store().select("rome");
    expect([pushes.mock.calls, replaces.mock.calls]).toEqual([[], []]);
  });

  it("writes selected-id into an address naming nothing, replacing the entry, once, before the store exists", () => {
    atAddress("?page=2");
    const { pushes, replaces } = historyWrites();
    const { feed, sync } = syncedFeed({ "url-state": "", "selected-id": "rome" });
    sync.start();
    sync.stop();
    sync.start();
    expect([selectedIn(feed), location.search]).toEqual(["rome", "?page=2&location=rome"]);
    expect([pushes.mock.calls.length, replaces.mock.calls.length]).toEqual([0, 1]);
  });

  it("writes nothing on start once the store exists, or when the address names a location", () => {
    atAddress("");
    const { pushes, replaces } = historyWrites();
    const created = syncedFeed({ "url-state": "", "selected-id": "rome" });
    created.feed.store();
    created.sync.start();
    goTo("?location=milan");
    replaces.mockClear();
    const named = syncedFeed({ "url-state": "", "selected-id": "rome" });
    named.sync.start();
    expect([pushes.mock.calls, replaces.mock.calls]).toEqual([[], []]);
  });

  it("pushes the visitor's selection of selected-id's location after the address's was selected", () => {
    atAddress("?location=milan");
    const { pushes } = historyWrites();
    const { feed, sync } = syncedFeed({ "url-state": "", "selected-id": "rome" });
    sync.start();
    feed.store().select("rome");
    expect([pushes.mock.calls.length, location.search]).toEqual([1, "?location=rome"]);
  });
});

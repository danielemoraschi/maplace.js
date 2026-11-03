// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { atAddress, ROME_LOCATION, selectedIn, syncedFeed, viewOf } from "./testing/address";

const ITALY = { center: "44,11", zoom: "6" };
const ITALY_VIEW = { kind: "center", center: { lat: 44, lng: 11 }, zoom: 6 };

describe("StoreFeed, the first view from center and zoom", () => {
  it("creates the store at center and zoom", () => {
    const { feed, errors } = syncedFeed(ITALY);
    expect([viewOf(feed), errors]).toEqual([ITALY_VIEW, []]);
  });

  it("creates it fitted, with misuse, for center alone", () => {
    const { feed, errors } = syncedFeed({ center: "44,11" });
    expect(viewOf(feed).kind).toBe("fit-all");
    expect(errors).toEqual([expect.objectContaining({ code: "invalid-input", field: "zoom" })]);
  });

  it("refuses center changed once the store exists, until put back", () => {
    const { host, feed, misuse, errors } = syncedFeed(ITALY);
    feed.store();
    host.setAttribute("center", "45,9");
    feed.checkAttributes();
    expect(errors.map(({ message }) => message)).toEqual([
      expect.stringMatching(/\bcenter\b.* can't change/),
    ]);
    host.setAttribute("center", "44,11");
    feed.checkAttributes();
    expect(misuse.stands()).toBe(false);
  });

  it("selects selected-id's location without moving off center and zoom", () => {
    const { feed } = syncedFeed({ ...ITALY, "selected-id": "rome" });
    expect([selectedIn(feed), viewOf(feed)]).toEqual(["rome", ITALY_VIEW]);
  });

  it("selects a selected-id location that arrives later without moving off center and zoom", () => {
    const { feed } = syncedFeed({ ...ITALY, "selected-id": "rome" }, []);
    feed.store();
    feed.giveLocations([ROME_LOCATION]);
    expect([selectedIn(feed), viewOf(feed)]).toEqual(["rome", ITALY_VIEW]);
  });

  it("with url-state and no address, writes selected-id in and still doesn't move off center and zoom", () => {
    atAddress("");
    const { feed, sync } = syncedFeed({ ...ITALY, "url-state": "", "selected-id": "rome" });
    sync.start();
    expect([selectedIn(feed), viewOf(feed), location.search]).toEqual([
      "rome",
      ITALY_VIEW,
      "?location=rome",
    ]);
  });

  it("opens at center and zoom from an address naming selected-id's own location, as a reload does", () => {
    atAddress("?location=rome");
    const { feed, sync } = syncedFeed({ ...ITALY, "url-state": "", "selected-id": "rome" });
    sync.start();
    expect([selectedIn(feed), viewOf(feed)]).toEqual(["rome", ITALY_VIEW]);
  });

  it("brings an address's other location into view", () => {
    atAddress("?location=milan");
    const { feed, sync } = syncedFeed({ ...ITALY, "url-state": "", "selected-id": "rome" });
    sync.start();
    expect([selectedIn(feed), viewOf(feed).kind]).toEqual(["milan", "location"]);
  });

  it("without center and zoom, still brings selected-id's location into view under url-state", () => {
    atAddress("");
    const { feed, sync } = syncedFeed({ "url-state": "", "selected-id": "rome" });
    sync.start();
    expect(viewOf(feed)).toEqual({ kind: "location", id: "rome", zoom: undefined });
  });
});

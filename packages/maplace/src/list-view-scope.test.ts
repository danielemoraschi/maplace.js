// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { groupNamesIn } from "./testing/lists";
import { movedTo, PLACES, readyScopedList, SCOPED, scopedList } from "./testing/scoped-list";
import { listedLocations } from "./views/listed-locations";

describe("createListView with scope: 'viewport'", () => {
  it("at load, shows the switch on 'All' and lists every location", async () => {
    const { group, listedCount, pressed } = await readyScopedList();
    expect([listedCount(), group.hidden, pressed()]).toEqual([5, false, ["true", "false"]]);
  });

  it("shows the switch before the map is ready, and before there is a view", () => {
    const { group, pressed } = scopedList({ holdApplies: true });
    expect([group.hidden, pressed()]).toEqual([false, ["true", "false"]]);
  });

  it("in 'All', keeps every location listed after a move", async () => {
    const { maplace, adapter, listedCount } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    expect(listedCount()).toBe(5);
  });

  it("'This area' lists what is in the view now, and presses its button", async () => {
    const { maplace, adapter, area, ids, pressed } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    area.click();
    expect([ids(), pressed()]).toEqual([["far-west"], ["false", "true"]]);
  });

  it("counts what the view lists under each heading, in 'This area'", async () => {
    const { list, maplace, adapter, area } = await readyScopedList(
      {},
      { scope: "viewport", groupCounts: true },
    );
    expect(groupNamesIn(list.element)).toEqual(["S (4)", "N (1)"]);
    await movedTo(maplace, adapter, -40);
    area.click();
    expect(groupNamesIn(list.element)).toEqual(["S (1)"]);
  });

  it("'This area' follows the map: each new view lists what it holds", async () => {
    const { maplace, adapter, area, ids } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    area.click();
    await movedTo(maplace, adapter, 40);
    expect(ids()).toEqual(["far-east"]);
    maplace.select("west");
    await adapter.probe().settle();
    expect(ids()).toContain("west");
  });

  it("'This area' keeps its list through a resize of the view, which keeps its centre and zoom", async () => {
    const { maplace, adapter, area, ids } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    area.click();
    const shown = maplace.getSnapshot().viewport ?? viewAround(-40, 5);
    adapter.host().reportViewportChange({
      ...shown,
      bounds: { ...shown.bounds, east: shown.bounds.east + 40 },
    });
    expect(ids()).toEqual(["far-west"]);
  });

  it("'This area' lists again on a change of locations or filter", async () => {
    const { maplace, adapter, area, ids } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    area.click();
    maplace.setFilter(["N"]);
    expect(ids()).toEqual([]);
    maplace.setFilter(undefined);
    expect(ids()).toEqual(["far-west"]);
    maplace.setLocations([...PLACES, { id: "near-west", lat: 0, lng: -41 }]);
    await adapter.probe().settle();
    expect(ids()).toEqual(["far-west", "near-west"]);
  });

  it("'This area' stays chosen with no view, listing everything until a view comes", async () => {
    const scoped = await readyScopedList();
    const { maplace, adapter, area, listedCount, detach, pressed } = scoped;
    await movedTo(maplace, adapter, -40);
    area.click();
    adapter.host().reportViewportChange({ ...viewAround(-40, 5), bounds: NO_AREA });
    expect([listedCount(), pressed()]).toEqual([5, ["false", "true"]]);
    adapter.host().reportViewportChange(viewAround(-40, 5));
    expect(listedCount()).toBe(1);
    detach();
    expect([listedCount(), pressed()]).toEqual([5, ["false", "true"]]);
  });

  it("'All' lists every location again, and presses its button", async () => {
    const { maplace, adapter, all, area, listedCount, pressed } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    area.click();
    all.click();
    expect([listedCount(), pressed()]).toEqual([5, ["true", "false"]]);
  });

  it("over an empty area, keeps the switch and says emptyAreaLabel in the status", async () => {
    const view = { ...SCOPED, emptyAreaLabel: "Nothing here" };
    const { maplace, adapter, group, area, status, list } = await readyScopedList({}, view);
    expect(status.textContent).toBe("");
    await movedTo(maplace, adapter, 150);
    area.click();
    expect([status.textContent, group.hidden, list.element.hidden]).toEqual([
      "Nothing here",
      false,
      false,
    ]);
    await movedTo(maplace, adapter, -40);
    expect(status.textContent).toBe("");
  });

  it("says so over an empty area with a fit-all entry too", async () => {
    const view = { ...SCOPED, fitAllLabel: "Everything" };
    const { maplace, adapter, area, status } = await readyScopedList({}, view);
    await movedTo(maplace, adapter, 150);
    area.click();
    expect(status.textContent).toBe("No locations in this area");
  });

  it("labels the buttons showAllLabel and areaOnlyLabel, 'All' and 'This area' by default, in a group named as the list", () => {
    const byDefault = scopedList();
    expect([byDefault.all.textContent, byDefault.area.textContent]).toEqual(["All", "This area"]);
    expect(byDefault.group.getAttribute("aria-label")).toBe("Locations");
    const view = { ...SCOPED, showAllLabel: "Everywhere", areaOnlyLabel: "Here", label: "Shops" };
    const given = scopedList({}, view);
    expect([given.all.textContent, given.area.textContent]).toEqual(["Everywhere", "Here"]);
    expect(given.group.getAttribute("aria-label")).toBe("Shops");
  });

  it("listedLocations stays unscoped", async () => {
    const { maplace, adapter, area } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    area.click();
    expect(listedLocations(maplace.getSnapshot())).toHaveLength(5);
  });
});

const NO_AREA = { south: 0, west: 0, north: 0, east: 0 };

/** A view of about 10° around (0, `lng`). */
function viewAround(lng: number, zoom: number) {
  return {
    center: { lat: 0, lng },
    zoom,
    bounds: { south: -5, west: lng - 5, north: 5, east: lng + 5 },
  };
}

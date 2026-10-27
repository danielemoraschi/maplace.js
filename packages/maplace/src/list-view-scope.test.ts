// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { movedTo, PLACES, readyScopedList, SCOPED, scopedList } from "./testing/scoped-list";
import { listedLocations } from "./views/listed-locations";

describe("createListView with scope: 'viewport'", () => {
  it("at load, lists every location with 'This area only' hidden, for locations given before attaching", async () => {
    const { areaOnly, listedCount } = await readyScopedList();
    expect([listedCount(), areaOnly.hidden]).toEqual([5, true]);
  });

  it("at load, the same when the fitted view is reported before ready", async () => {
    const { maplace, adapter, areaOnly, listedCount } = scopedList({ holdApplies: true });
    await adapter.finishMount();
    await adapter.probe().settle();
    expect(maplace.getSnapshot().loadState).toBe("loading");
    await adapter.finishApplies();
    await maplace.whenReady();
    expect([listedCount(), areaOnly.hidden]).toEqual([5, true]);
  });

  it("at load, the same for locations set after the map opened", async () => {
    const { maplace, adapter, areaOnly, listedCount } = scopedList({ locations: [] });
    await adapter.finishMount();
    await maplace.whenReady();
    await adapter.probe().settle();
    maplace.setLocations(PLACES);
    await adapter.probe().settle();
    expect([listedCount(), areaOnly.hidden]).toEqual([5, true]);
  });

  it("shows no 'This area only' for a view reported while loading", async () => {
    const { adapter, areaOnly } = scopedList({ holdApplies: true });
    await adapter.finishMount();
    adapter.host().reportViewportChange(viewAround(-40, 5));
    expect(areaOnly.hidden).toBe(true);
  });

  it("stays unscoped for a viewport with no area", async () => {
    const { maplace, adapter, areaOnly, listedCount } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    areaOnly.click();
    adapter.host().reportViewportChange({ ...viewAround(-40, 5), bounds: NO_AREA });
    expect([listedCount(), areaOnly.hidden]).toEqual([5, true]);
  });

  it("shows 'This area only' after a move that would list other locations, keeping the list as it was", async () => {
    const { maplace, adapter, areaOnly, listedCount } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    expect([listedCount(), areaOnly.hidden]).toEqual([5, false]);
  });

  it("shows no 'This area only' for a move that lists the same", async () => {
    const { maplace, adapter, areaOnly } = await readyScopedList();
    maplace.setView({ lat: 10, lng: 0 }, 1);
    await adapter.probe().settle();
    expect(areaOnly.hidden).toBe(true);
  });

  it("shows no 'This area only' for a resize of the scoped view, which keeps its centre and zoom", async () => {
    const { maplace, adapter, areaOnly } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    areaOnly.click();
    const scopedTo = maplace.getSnapshot().viewport ?? viewAround(-40, 5);
    adapter.host().reportViewportChange({
      ...scopedTo,
      bounds: { ...scopedTo.bounds, east: scopedTo.bounds.east + 40 },
    });
    expect(areaOnly.hidden).toBe(true);
  });

  it("'This area only' lists what is in the view now, and hides", async () => {
    const { maplace, adapter, areaOnly, ids } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    areaOnly.click();
    expect([ids(), areaOnly.hidden]).toEqual([["far-west"], true]);
  });

  it("a selection that moves the map shows 'This area only'", async () => {
    const { maplace, adapter, areaOnly } = await readyScopedList();
    maplace.setView({ lat: 0, lng: 0 }, 4);
    await adapter.probe().settle();
    areaOnly.click();
    maplace.select("far-east");
    await adapter.probe().settle();
    expect(areaOnly.hidden).toBe(false);
  });

  it("says emptyAreaLabel in a status when filtering to the view lists nothing", async () => {
    const view = { ...SCOPED, emptyAreaLabel: "Nothing here" };
    const { maplace, adapter, areaOnly, status, list } = await readyScopedList({}, view);
    await movedTo(maplace, adapter, 150);
    areaOnly.click();
    expect([status.hidden, status.textContent, list.element.hidden]).toEqual([
      false,
      "Nothing here",
      false,
    ]);
  });

  it("says so in the status over an empty area with a fit-all entry too", async () => {
    const view = { ...SCOPED, fitAllLabel: "All" };
    const { maplace, adapter, areaOnly, status } = await readyScopedList({}, view);
    await movedTo(maplace, adapter, 150);
    areaOnly.click();
    expect(status.hidden).toBe(false);
  });

  it("shows no 'This area only' for a resize of the fitted view while unscoped", async () => {
    const { maplace, adapter, areaOnly } = await readyScopedList();
    const fitted = maplace.getSnapshot().viewport ?? viewAround(0, 3);
    adapter.host().reportViewportChange({
      ...fitted,
      bounds: { ...fitted.bounds, west: -35, east: 35 },
    });
    expect(areaOnly.hidden).toBe(true);
  });

  it("a detach lists everything again and hides both buttons and the status", async () => {
    const scoped = await readyScopedList();
    const { maplace, adapter, areaOnly, showAll, status, listedCount, detach } = scoped;
    await movedTo(maplace, adapter, 150);
    areaOnly.click();
    await movedTo(maplace, adapter, -40);
    detach();
    expect([listedCount(), areaOnly.hidden, showAll.hidden, status.hidden]).toEqual([
      5,
      true,
      true,
      true,
    ]);
  });

  it("labels the button areaOnlyLabel, 'This area only' by default", async () => {
    expect(scopedList().areaOnly.textContent).toBe("This area only");
    const view = { ...SCOPED, areaOnlyLabel: "Look here" };
    expect(scopedList({}, view).areaOnly.textContent).toBe("Look here");
  });

  it("lists what the filter shows within the view", async () => {
    const { maplace, adapter, areaOnly, ids } = await readyScopedList();
    maplace.setFilter(["N"]);
    maplace.setView({ lat: 15, lng: 0 }, 3);
    await adapter.probe().settle();
    areaOnly.click();
    expect(ids()).toEqual(["north"]);
  });

  it("listedLocations stays unscoped", async () => {
    const { maplace, adapter, areaOnly } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    areaOnly.click();
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

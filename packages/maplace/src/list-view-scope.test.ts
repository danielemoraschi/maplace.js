// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished } from "vitest";
import { createListView, type ListViewOptions } from "./list-view";
import type { Location } from "./location";
import { createMaplace } from "./maplace/create";
import { sizedContainer } from "./testing/container";
import { createFakeAdapter, type FakeAdapter } from "./testing/fake-adapter";
import { optionsIn } from "./testing/lists";
import { listedLocations } from "./views/listed-locations";

/** Four places along the equator, and one up north in group "N". */
const locations: Location[] = [
  { id: "far-west", lat: 0, lng: -40, group: "S" },
  { id: "west", lat: 0, lng: -10, group: "S" },
  { id: "east", lat: 0, lng: 10, group: "S" },
  { id: "far-east", lat: 0, lng: 40, group: "S" },
  { id: "north", lat: 30, lng: 0, group: "N" },
];

const SCOPED: ListViewOptions = { scope: "viewport", groupHeadings: false };

/** A store on the fake with a scoped list view, attached; a held fake keeps the store loading. */
function scopedList(
  options: { locations?: Location[]; holdApplies?: boolean } = {},
  view: ListViewOptions = SCOPED,
) {
  const maplace = createMaplace({ locations: options.locations ?? locations });
  const adapter = createFakeAdapter({ holdApplies: options.holdApplies ?? false });
  const list = createListView(maplace, view);
  document.body.append(list.element);
  const map = sizedContainer();
  const detach = maplace.attach(adapter, map);
  onTestFinished(() => {
    list.destroy();
    detach();
    map.remove();
  });
  const button = list.element.querySelector<HTMLButtonElement>(".maplace-search-area");
  const status = list.element.querySelector<HTMLElement>(".maplace-empty-area");
  if (button === null || status === null) throw new Error("no search area");
  const ids = () => optionsIn(list.element).map((option) => option.textContent);
  return { maplace, adapter, list, button, status, detach, ids, listedCount: () => ids().length };
}

/** `scopedList`, ready, at the view it fitted. */
async function readyScopedList(...args: Parameters<typeof scopedList>) {
  const scoped = scopedList(...args);
  await opened(scoped.adapter);
  await scoped.maplace.whenReady();
  await scoped.adapter.probe().settle();
  return scoped;
}

async function opened(adapter: FakeAdapter): Promise<void> {
  await adapter.finishMount();
}

describe("createListView with scope: 'viewport'", () => {
  it("at load, lists every location with the button hidden, for locations given before attaching", async () => {
    const { button, listedCount } = await readyScopedList();
    expect([listedCount(), button.hidden]).toEqual([5, true]);
  });

  it("at load, the same when the fitted view is reported before ready", async () => {
    const { maplace, adapter, button, listedCount } = scopedList({ holdApplies: true });
    await opened(adapter);
    await adapter.probe().settle();
    expect(maplace.getSnapshot().loadState).toBe("loading");
    await adapter.finishApplies();
    await maplace.whenReady();
    expect([listedCount(), button.hidden]).toEqual([5, true]);
  });

  it("at load, the same for locations set after the map opened", async () => {
    const { maplace, adapter, button, listedCount } = scopedList({ locations: [] });
    await opened(adapter);
    await maplace.whenReady();
    await adapter.probe().settle();
    maplace.setLocations(locations);
    await adapter.probe().settle();
    expect([listedCount(), button.hidden]).toEqual([5, true]);
  });

  it("shows no button for a view reported while loading", async () => {
    const { adapter, button } = scopedList({ holdApplies: true });
    await opened(adapter);
    adapter.host().reportViewportChange(viewAround(-40, 5));
    expect(button.hidden).toBe(true);
  });

  it("stays unscoped for a viewport with no area", async () => {
    const { maplace, adapter, button, listedCount } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    button.click();
    adapter.host().reportViewportChange({ ...viewAround(-40, 5), bounds: NO_AREA });
    expect([listedCount(), button.hidden]).toEqual([5, true]);
  });

  it("shows the button after a move that would list other locations, keeping the list as it was", async () => {
    const { maplace, adapter, button, listedCount } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    expect([listedCount(), button.hidden]).toEqual([5, false]);
  });

  it("shows no button for a move that lists the same", async () => {
    const { maplace, adapter, button } = await readyScopedList();
    maplace.setView({ lat: 10, lng: 0 }, 1);
    await adapter.probe().settle();
    expect(button.hidden).toBe(true);
  });

  it("shows no button for a resize of the scoped view, which keeps its centre and zoom", async () => {
    const { maplace, adapter, button } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    button.click();
    const scopedTo = maplace.getSnapshot().viewport ?? viewAround(-40, 5);
    adapter.host().reportViewportChange({
      ...scopedTo,
      bounds: { ...scopedTo.bounds, east: scopedTo.bounds.east + 40 },
    });
    expect(button.hidden).toBe(true);
  });

  it("the button lists what is in the view now, and hides", async () => {
    const { maplace, adapter, button, ids } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    button.click();
    expect([ids(), button.hidden]).toEqual([["far-west"], true]);
  });

  it("a selection that moves the map shows the button", async () => {
    const { maplace, adapter, button } = await readyScopedList();
    maplace.setView({ lat: 0, lng: 0 }, 4);
    await adapter.probe().settle();
    button.click();
    maplace.select("far-east");
    await adapter.probe().settle();
    expect(button.hidden).toBe(false);
  });

  it("says emptyAreaLabel in a status when a search lists nothing", async () => {
    const view = { ...SCOPED, emptyAreaLabel: "Nothing here" };
    const { maplace, adapter, button, status, list } = await readyScopedList({}, view);
    await movedTo(maplace, adapter, 150);
    button.click();
    expect([status.hidden, status.textContent, list.element.hidden]).toEqual([
      false,
      "Nothing here",
      false,
    ]);
  });

  it("says so in the status over an empty area with a fit-all entry too", async () => {
    const view = { ...SCOPED, fitAllLabel: "All" };
    const { maplace, adapter, button, status } = await readyScopedList({}, view);
    await movedTo(maplace, adapter, 150);
    button.click();
    expect(status.hidden).toBe(false);
  });

  it("shows no button for a resize of the fitted view while unscoped", async () => {
    const { maplace, adapter, button } = await readyScopedList();
    const fitted = maplace.getSnapshot().viewport ?? viewAround(0, 3);
    adapter.host().reportViewportChange({
      ...fitted,
      bounds: { ...fitted.bounds, west: -35, east: 35 },
    });
    expect(button.hidden).toBe(true);
  });

  it("a detach lists everything again and hides the button and the status", async () => {
    const { maplace, adapter, button, status, listedCount, detach } = await readyScopedList();
    await movedTo(maplace, adapter, 150);
    button.click();
    await movedTo(maplace, adapter, -40);
    detach();
    expect([listedCount(), button.hidden, status.hidden]).toEqual([5, true, true]);
  });

  it("labels the button searchAreaLabel, 'Search this area' by default", async () => {
    expect(scopedList().button.textContent).toBe("Search this area");
    const view = { ...SCOPED, searchAreaLabel: "Look here" };
    expect(scopedList({}, view).button.textContent).toBe("Look here");
  });

  it("lists what the filter shows within the view", async () => {
    const { maplace, adapter, button, ids } = await readyScopedList();
    maplace.setFilter(["N"]);
    maplace.setView({ lat: 15, lng: 0 }, 3);
    await adapter.probe().settle();
    button.click();
    expect(ids()).toEqual(["north"]);
  });

  it("listedLocations stays unscoped", async () => {
    const { maplace, adapter, button } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    button.click();
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

/** The map moved, as a user would, to zoom 5 over (0, `lng`). */
async function movedTo(
  maplace: ReturnType<typeof createMaplace>,
  adapter: FakeAdapter,
  lng: number,
): Promise<void> {
  maplace.setView({ lat: 0, lng }, 5);
  await adapter.probe().settle();
}

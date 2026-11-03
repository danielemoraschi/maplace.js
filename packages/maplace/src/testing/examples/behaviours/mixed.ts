import { expect } from "vitest";
import type { ExampleRun } from "../example-runs";
import { byText, type ExampleBehaviour, labelsIn, lastFit, selectedEntryIn } from "./reading";

/** Each location, as the list names it, what the map draws it as, and a shape's latitudes. */
const MARKER = { id: "tower-of-london", title: "Tower of London", type: "marker" } as const;
const SHAPES = [
  { id: "greenwich", title: "Greenwich", type: "circle", north: 51.4814, south: 51.4724 },
  {
    id: "hyde-park",
    title: "Hyde Park",
    type: "polygon",
    north: 51.5115,
    south: 51.503,
  },
  { id: "thames", title: "Along the Thames", type: "polyline", north: 51.5098, south: 51.5009 },
] as const;
const DRAWN = [MARKER, ...SHAPES];

export const mixed: ExampleBehaviour = async (run) => {
  expectEachTypeDrawn(run);
  await expectListNamesAll(run);
  expectFirstViewFitsAll(run);
  await expectClickSelectsInList(run);
  await expectListPickMovesMap(run);
};

const expectEachTypeDrawn = ({ adapter }: ExampleRun): void => {
  for (const { id, type } of DRAWN) {
    expect(adapter.probe().location(id)?.geometry.type).toBe(type);
  }
};

const expectListNamesAll: ExampleBehaviour = async ({ root }) => {
  await expect.poll(() => labelsIn(root)).toEqual(DRAWN.map(({ title }) => title));
};

/** Called before any click, so the last view is the first: it holds every shape. */
const expectFirstViewFitsAll = ({ adapter }: ExampleRun): void => {
  const firstView = lastFit(adapter);
  expect(firstView).toBeDefined();
  const { north, east, south, west } = firstView?.bounds ?? {};
  expectWithin(north, 51.5115, 51.52);
  expectWithin(east, 0.0067, 0.01);
  expectWithin(south, 51.47, 51.473);
  expectWithin(west, -0.18, -0.175);
};

/** A click on the map selects the location, and the list says so, for each type alike. */
const expectClickSelectsInList: ExampleBehaviour = async ({ store, adapter, root }) => {
  for (const { id, title } of DRAWN) {
    adapter.probe().click(id);
    await expect.poll(() => store.getSnapshot().selectedId).toBe(id);
    await expect.poll(() => selectedEntryIn(root)?.firstChild?.textContent).toBe(title);
  }
};

/** Picking an entry selects its location and takes the map to that one, for each type alike. */
const expectListPickMovesMap: ExampleBehaviour = async (run) => {
  await pick(run, MARKER);
  expect(run.adapter.callsOf("setView").at(-1)?.view).toEqual({
    kind: "location",
    id: MARKER.id,
    zoom: undefined,
  });
  for (const shape of SHAPES) {
    await pick(run, shape);
    expect(lastFit(run.adapter)?.bounds.north).toBeCloseTo(shape.north, 3);
    expect(lastFit(run.adapter)?.bounds.south).toBeCloseTo(shape.south, 3);
  }
};

/** Clicks the list's entry for a location, until it is selected and the map has been told. */
async function pick(
  { store, adapter, root }: ExampleRun,
  { id, title }: (typeof DRAWN)[number],
): Promise<void> {
  const viewsBefore = adapter.callsOf("setView").length;
  byText(root, '[role="option"]', title).click();
  await expect.poll(() => store.getSnapshot().selectedId).toBe(id);
  await expect.poll(() => adapter.callsOf("setView").length).toBeGreaterThan(viewsBefore);
}

function expectWithin(value: number | undefined, min: number, max: number): void {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

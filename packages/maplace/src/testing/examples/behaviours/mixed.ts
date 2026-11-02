import { expect } from "vitest";
import type { ExampleRun } from "../example-runs";
import { byText, type ExampleBehaviour, labelsIn, lastFit, selectedEntryIn } from "./reading";

/** Each location, as the list names it, what the map draws it as, and a shape's latitudes. */
const MARKER = { id: "colosseum", title: "Colosseum", type: "marker" } as const;
const SHAPES = [
  { id: "trastevere", title: "Trastevere", type: "circle", north: 41.8912, south: 41.8822 },
  {
    id: "villa-borghese",
    title: "Villa Borghese",
    type: "polygon",
    north: 41.9175,
    south: 41.9085,
  },
  { id: "tiber", title: "Along the Tiber", type: "polyline", north: 41.9117, south: 41.8906 },
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
  expectWithin(north, 41.9175, 41.92);
  expectWithin(east, 12.4922, 12.495);
  expectWithin(south, 41.88, 41.883);
  expectWithin(west, 12.46, 12.465);
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

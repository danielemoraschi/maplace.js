import { expect } from "vitest";
import type { Maplace } from "../../../index";
import type { FakeAdapter } from "../../fake-adapter";
import type { ExampleRun } from "../example-runs";
import { type BoundsView, clickButton, type ExampleBehaviour } from "./reading";

/** The text of the buttons `selector` finds in `root`. */
const buttonTexts = (root: Element, selector: string) =>
  [...root.querySelectorAll(selector)].map(({ textContent }) => textContent?.trim());

/** The data sets' buttons shown pressed: the set on the map, or on its way. */
const pressed = (root: Element) => buttonTexts(root, 'button[aria-pressed="true"]');

const ids = (store: Maplace) => store.getSnapshot().locations.map(({ id }) => id);

export const mixed: ExampleBehaviour = async (run) => {
  await expectStartsOnMarkers(run, ["Markers", "More markers", "Route", "Area", "Circle"]);
  await expectRouteSetShown(run);
  await expectRouteDrawn(run);
  await expectAreaFitted(run);
};

/** On MapLibre, which has no routing: no route to show, so no button for it. */
export const mixedWithoutRoute: ExampleBehaviour = async (run) => {
  await expectStartsOnMarkers(run, ["Markers", "More markers", "Area", "Circle"]);
  await expectAreaFitted(run);
};

async function expectStartsOnMarkers(
  { store, root }: ExampleRun,
  buttons: readonly string[],
): Promise<void> {
  await expect.poll(() => ids(store)).toEqual(["a1", "a2", "a3"]);
  expect(buttonTexts(root, "button[aria-pressed]")).toEqual(buttons);
  expect(pressed(root)).toEqual(["Markers"]);
}

async function expectRouteSetShown({ store, root }: ExampleRun): Promise<void> {
  clickButton(root, "Route");
  await expect.poll(() => pressed(root)).toEqual(["Route"]);
  await expect.poll(() => ids(store)).toEqual(["c1", "c2", "c3"]);
}

async function expectRouteDrawn({ store, adapter }: ExampleRun): Promise<void> {
  await expect.poll(() => store.getSnapshot().route?.stops).toEqual(["c1", "c2", "c3"]);
  await expect.poll(() => routedLegs(store, adapter)).toBe(2);
}

async function expectAreaFitted({ store, adapter, root }: ExampleRun): Promise<void> {
  clickButton(root, "Area");
  await expect.poll(() => ids(store)).toEqual(["d1"]);
  expect(store.getSnapshot().route).toBeUndefined();
  await expect.poll(() => lastFit(adapter)?.bounds.north).toBeCloseTo(52.1);
  expect(lastFit(adapter)?.bounds.south).toBeCloseTo(47.8);
}

/** How many legs the route computed has, once the fake computes it. */
async function routedLegs(store: Maplace, adapter: FakeAdapter): Promise<number | undefined> {
  await adapter.probe().settle();
  return store.getSnapshot().routeResult?.legs.length;
}

function lastFit(adapter: FakeAdapter): BoundsView | undefined {
  const view = adapter.callsOf("setView").at(-1)?.view;
  return view?.kind === "fit-bounds" ? view : undefined;
}

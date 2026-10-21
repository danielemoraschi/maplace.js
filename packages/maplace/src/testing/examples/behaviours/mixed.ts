import { expect } from "vitest";
import type { Maplace } from "../../../index";
import type { FakeAdapter } from "../../fake-adapter";
import { type BoundsView, clickButton, type ExampleBehaviour } from "./reading";

/** The group buttons shown pressed: the group on the map, or on its way. */
const pressed = (root: Element) =>
  [...root.querySelectorAll('button[aria-pressed="true"]')].map(({ textContent }) =>
    textContent?.trim(),
  );

const ids = (store: Maplace) => store.getSnapshot().locations.map(({ id }) => id);

export const mixed: ExampleBehaviour = async ({ store, adapter, root }) => {
  await expect.poll(() => ids(store)).toEqual(["a1", "a2", "a3"]);
  expect(pressed(root)).toEqual(["Group A"]);
  clickButton(root, "Group C");
  await expect.poll(() => pressed(root)).toEqual(["Group C"]);
  await expect.poll(() => ids(store)).toEqual(["c1", "c2", "c3"]);
  await expect.poll(() => store.getSnapshot().route?.stops).toEqual(["c1", "c2", "c3"]);
  await expect.poll(() => routedLegs(store, adapter)).toBe(2);
  clickButton(root, "Group D");
  await expect.poll(() => ids(store)).toEqual(["d1"]);
  expect(store.getSnapshot().route).toBeUndefined();
  await expect.poll(() => lastFit(adapter)?.bounds.north).toBeCloseTo(52.1);
  expect(lastFit(adapter)?.bounds.south).toBeCloseTo(47.8);
};

/** How many legs the route computed has, once the fake computes it. */
async function routedLegs(store: Maplace, adapter: FakeAdapter): Promise<number | undefined> {
  await adapter.probe().settle();
  return store.getSnapshot().routeResult?.legs.length;
}

function lastFit(adapter: FakeAdapter): BoundsView | undefined {
  const view = adapter.callsOf("setView").at(-1)?.view;
  return view?.kind === "fit-bounds" ? view : undefined;
}

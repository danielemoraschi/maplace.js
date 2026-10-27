import { expect } from "vitest";
import { isListed } from "../../../location-state";
import { clickButton, controlPositions, type ExampleBehaviour } from "./reading";

const SEARCH_AREA = "Search this area";

/** The list's entries inside `root`. */
function entriesIn(root: Element): number {
  return root.querySelectorAll("[role=option]").length;
}

/**
 * A list on the map that follows it: every point listed at load, the list kept as it was after a
 * move, with "Search this area" shown, and that button listing what is in view.
 */
export const big: ExampleBehaviour = async ({ store, adapter, root }) => {
  expect(controlPositions(adapter)).toEqual(["top-right"]);
  const listedCount = () => {
    const { locations, filter } = store.getSnapshot();
    return locations.filter((location) => isListed(location, filter)).length;
  };
  // A React version sets its points after its first render: settle again until all are listed.
  await expect.poll(listedCount).toBeGreaterThan(0);
  await expect
    .poll(async () => {
      await adapter.probe().settle();
      return entriesIn(root);
    })
    .toBe(listedCount());
  const button = () => root.querySelector<HTMLButtonElement>(".maplace-search-area");
  expect(button()?.hidden).toBe(true);

  store.setView({ lat: 40, lng: -100 }, 5);
  await adapter.probe().settle();
  await expect.poll(() => button()?.hidden).toBe(false);
  expect(entriesIn(root)).toBe(listedCount());

  clickButton(root, SEARCH_AREA);
  await expect.poll(() => entriesIn(root)).toBeLessThan(listedCount());
  expect(entriesIn(root)).toBeGreaterThan(0);
  expect(button()?.hidden).toBe(true);
};

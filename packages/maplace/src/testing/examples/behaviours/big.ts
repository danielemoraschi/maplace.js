import { expect } from "vitest";
import { isListed } from "../../../location-state";
import { clickButton, controlPositions, type ExampleBehaviour } from "./reading";

const ALL = "All";
const THIS_AREA = "This area";

/** The titles the list inside `root` lists. */
function listedIn(root: Element): (string | null)[] {
  return Array.from(root.querySelectorAll("[role=option]"), (option) => option.textContent);
}

/** The list's entries inside `root`. */
function entriesIn(root: Element): number {
  return root.querySelectorAll("[role=option]").length;
}

/**
 * A list on the map that follows it: every point listed at load with the switch on "All", the
 * list kept as it was after a move; "This area" listing what is in view, and listing again after
 * the next move; "All" listing every point again.
 */
export const big: ExampleBehaviour = async ({ store, adapter, root }) => {
  expect(controlPositions(adapter)).toEqual(["top-right"]);
  const listedCount = () => {
    const { locations, filter } = store.getSnapshot();
    return locations.filter((location) => isListed(location, filter)).length;
  };
  const moveTo = async (lat: number, lng: number) => {
    store.setView({ lat, lng }, 5);
    await adapter.probe().settle();
  };
  // A React version sets its points after its first render: settle again until all are listed.
  await expect.poll(listedCount).toBeGreaterThan(0);
  await expect
    .poll(async () => {
      await adapter.probe().settle();
      return entriesIn(root);
    })
    .toBe(listedCount());
  const pressed = (name: string) =>
    root.querySelector(`.maplace-${name}`)?.getAttribute("aria-pressed");
  expect([pressed("show-all"), pressed("area-only")]).toEqual(["true", "false"]);

  await moveTo(40, -100);
  expect(entriesIn(root)).toBe(listedCount());

  clickButton(root, THIS_AREA);
  await expect.poll(() => entriesIn(root)).toBeLessThan(listedCount());
  expect(entriesIn(root)).toBeGreaterThan(0);
  expect([pressed("show-all"), pressed("area-only")]).toEqual(["false", "true"]);
  const inFirstArea = listedIn(root);
  await moveTo(35, -85);
  await expect.poll(() => listedIn(root)).not.toEqual(inFirstArea);

  clickButton(root, ALL);
  await expect.poll(() => entriesIn(root)).toBe(listedCount());
  expect(pressed("show-all")).toBe("true");
};

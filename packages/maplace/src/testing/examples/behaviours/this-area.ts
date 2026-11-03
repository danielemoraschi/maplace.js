import { expect } from "vitest";
import { clickButton, controlPositions, type ExampleBehaviour, listedIn } from "./reading";

const ALL = "All";
const THIS_AREA = "This area";
const EVERY_CAPITAL = 12;

/** The list's entries inside `root`. */
function entriesIn(root: Element): number {
  return root.querySelectorAll("[role=option]").length;
}

/**
 * A list on the map that follows it: every point listed at load with the switch on "All", the
 * list kept as it was after a move; "This area" listing what is in view, and listing again after
 * the next move; "All" listing every point again.
 */
export const thisArea: ExampleBehaviour = async ({ store, adapter, root }) => {
  expect(controlPositions(adapter)).toEqual(["top-left"]);
  const moveTo = async (lat: number, lng: number) => {
    store.setView({ lat, lng }, 5);
    await adapter.probe().settle();
  };
  await expect.poll(() => entriesIn(root)).toBe(EVERY_CAPITAL);
  const pressed = (name: string) =>
    root.querySelector(`.maplace-${name}`)?.getAttribute("aria-pressed");
  expect([pressed("show-all"), pressed("area-only")]).toEqual(["true", "false"]);

  await moveTo(48.85, 2.35);
  expect(entriesIn(root)).toBe(EVERY_CAPITAL);

  clickButton(root, THIS_AREA);
  await expect.poll(() => entriesIn(root)).toBeLessThan(EVERY_CAPITAL);
  expect(entriesIn(root)).toBeGreaterThan(0);
  expect([pressed("show-all"), pressed("area-only")]).toEqual(["false", "true"]);
  const inFirstArea = listedIn(root);
  await moveTo(41.9, 12.5);
  await expect.poll(() => listedIn(root)).not.toEqual(inFirstArea);

  clickButton(root, ALL);
  await expect.poll(() => entriesIn(root)).toBe(EVERY_CAPITAL);
  expect(pressed("show-all")).toBe("true");
};

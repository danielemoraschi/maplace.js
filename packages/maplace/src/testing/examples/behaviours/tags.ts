import { expect } from "vitest";
import {
  controlPositions,
  type ExampleBehaviour,
  inputLabelled,
  listedIn,
  listIn,
} from "./reading";

const ALL = ["Rome", "Bologna", "Milan", "Turin", "Naples"];

/** The group headings the list inside `root` shows. */
function headingsIn(root: Element): (string | null)[] {
  const groups = listIn(root)?.querySelectorAll("[role=group]") ?? [];
  return Array.from(groups, (group) => group.getAttribute("aria-label"));
}

/**
 * A list on the map that the page's checkboxes filter: one tag keeps the places with it, both
 * keep the places with both, none lists every place, and the headings stay the places' groups.
 */
export const tags: ExampleBehaviour = async ({ adapter, root }) => {
  const toggle = (label: string) => inputLabelled(root, label).click();
  expect(controlPositions(adapter)).toEqual(["top-right"]);
  await expect.poll(() => listedIn(root)).toEqual(ALL);
  expect(headingsIn(root)).toEqual(["Centre", "North", "South"]);

  toggle("Parking");
  await expect.poll(() => listedIn(root)).toEqual(["Rome", "Milan", "Naples"]);
  expect(headingsIn(root)).toEqual(["Centre", "North", "South"]);

  toggle("Open late");
  await expect.poll(() => listedIn(root)).toEqual(["Rome", "Naples"]);
  expect(headingsIn(root)).toEqual(["Centre", "South"]);

  toggle("Parking");
  await expect.poll(() => listedIn(root)).toEqual(["Rome", "Turin", "Naples"]);

  toggle("Open late");
  await expect.poll(() => listedIn(root)).toEqual(ALL);
};

import { expect } from "vitest";
import {
  byText,
  controlPositions,
  type ExampleBehaviour,
  headingsIn,
  lastFit,
  listedIn,
} from "./reading";

const CITIES = ["Edinburgh", "Glasgow", "Belfast", "London", "Bristol", "Cardiff"];

/**
 * The list beside the map, none of it on the map: the places under their regions after an entry
 * that fits them all, an entry selecting its place, and the first clearing it again.
 */
export const sideList: ExampleBehaviour = async ({ store, adapter, root }) => {
  const entry = (text: string) => byText(root, '[role="option"]', text);
  expect(controlPositions(adapter)).toEqual([]);
  await expect.poll(() => listedIn(root)).toEqual(["All cities", ...CITIES]);
  expect(headingsIn(root)).toEqual(["North", "South"]);

  entry("Bristol").click();
  await expect.poll(() => store.getSnapshot().selectedId).toBe("bristol");

  entry("All cities").click();
  await expect.poll(() => store.getSnapshot().selectedId).toBeUndefined();
  await expect.poll(() => lastFit(adapter)).toBeDefined();
};

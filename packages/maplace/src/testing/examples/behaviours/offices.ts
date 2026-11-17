import { expect } from "vitest";
import { type ExampleBehaviour, headingsIn, inputLabelled, listedIn } from "./reading";

const OFFICES = 16;
const IN_EUROPE = ["Milan", "Rome", "Turin", "Paris", "Lyon", "London", "Manchester"];
const IN_ITALY = ["Milan", "Rome", "Turin"];

/**
 * Offices by region and country, the list nesting the countries under their regions, each
 * heading counting all under it, and a checkbox for each above it: unticking a region leaves its
 * offices out, unticking a country leaves its region partly ticked, and a click on that region
 * ticks all of it again; with every box ticked the filter asks for no group.
 */
export const offices: ExampleBehaviour = async ({ store, root }) => {
  const box = (label: string) => inputLabelled(root, label);
  await expect.poll(() => listedIn(root)).toHaveLength(OFFICES);
  expect(headingsIn(root).slice(0, 4)).toEqual([
    "Europe (7)",
    "Italy (3)",
    "France (2)",
    "United Kingdom (2)",
  ]);

  box("Europe").click();
  await expect.poll(() => listedIn(root)).toHaveLength(OFFICES - IN_EUROPE.length);
  expect(listedIn(root).filter((title) => IN_EUROPE.includes(title ?? ""))).toEqual([]);
  box("Europe").click();
  await expect.poll(() => listedIn(root)).toHaveLength(OFFICES);
  expect(store.getSnapshot().filter?.groups).toBeUndefined();

  box("Italy").click();
  await expect.poll(() => listedIn(root)).toHaveLength(OFFICES - IN_ITALY.length);
  expect([box("Europe").checked, box("Europe").indeterminate]).toEqual([false, true]);
  expect(headingsIn(root)[0]).toBe(`Europe (${IN_EUROPE.length - IN_ITALY.length})`);

  box("Europe").click();
  await expect.poll(() => listedIn(root)).toHaveLength(OFFICES);
  expect([box("Europe").checked, box("Italy").checked]).toEqual([true, true]);
  expect(store.getSnapshot().filter?.groups).toBeUndefined();
};

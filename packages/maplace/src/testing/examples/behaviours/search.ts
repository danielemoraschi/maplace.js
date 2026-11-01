import { expect } from "vitest";
import { controlPositions, type ExampleBehaviour, listedIn, textIn } from "./reading";

const ALL = ["Rome", "Bologna", "Forlì", "Milan", "Turin", "Genoa", "Naples", "Bari"];

/**
 * A list beside the map under a search box: a name, a name without its accent and a `searchText`
 * word each narrow it, the status says how many or none, and an empty box lists every place.
 */
export const search: ExampleBehaviour = async ({ adapter, root }) => {
  const box = root.querySelector<HTMLInputElement>("input[type=search]");
  if (box === null) throw new Error("no search box");
  const type = (text: string) => {
    box.value = text;
    box.dispatchEvent(new InputEvent("input", { bubbles: true }));
  };
  const said = () => textIn(root, ".maplace-search-status");
  expect(controlPositions(adapter)).toEqual([]);
  await expect.poll(() => listedIn(root)).toEqual(ALL);

  type("mil");
  await expect.poll(() => listedIn(root)).toEqual(["Milan"]);
  expect(said()).toBe("Locations found: 1");

  type("forli");
  await expect.poll(() => listedIn(root)).toEqual(["Forlì"]);

  type("harbour");
  await expect.poll(() => listedIn(root)).toEqual(["Genoa", "Naples", "Bari"]);
  expect(said()).toBe("Locations found: 3");

  type("oslo");
  await expect.poll(() => listedIn(root)).toEqual([]);
  expect(said()).toBe("No locations match");

  type("");
  await expect.poll(() => listedIn(root)).toEqual(ALL);
  expect(said()).toBe("");
};

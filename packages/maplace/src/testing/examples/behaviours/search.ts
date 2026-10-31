import { expect, vi } from "vitest";
import {
  clickButton,
  controlPositions,
  type ExampleBehaviour,
  labelsIn,
  listedIn,
  textIn,
} from "./reading";

const ALL = ["Rome", "Bologna", "Forlì", "Milan", "Turin", "Genoa", "Naples", "Bari"];

/** Oslo: every place south of it, so the nearest are in the North, then Centre, then South. */
const ABOVE_THEM_ALL = { latitude: 59.91, longitude: 10.75 };
const NEAREST_FIRST = ["Milan", "Turin", "Genoa", "Bologna", "Forlì", "Rome", "Bari", "Naples"];

/**
 * A list beside the map under a search box: a name, a name without its accent and a `searchText`
 * word each narrow it, the status says how many or none, and an empty box lists every place. A
 * "My location" button on the map asks for the position only when pressed and sorts the list.
 */
export const search: ExampleBehaviour = async ({ adapter, root }) => {
  const box = root.querySelector<HTMLInputElement>("input[type=search]");
  if (box === null) throw new Error("no search box");
  const type = (text: string) => {
    box.value = text;
    box.dispatchEvent(new InputEvent("input", { bubbles: true }));
  };
  const said = () => textIn(root, ".maplace-search-status");
  expect(controlPositions(adapter)).toEqual(["top-left"]);
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

  const { geolocation } = root.ownerDocument.defaultView?.navigator ?? navigator;
  const asked = vi
    .spyOn(geolocation, "getCurrentPosition")
    .mockImplementation((arrived) => arrived({ coords: ABOVE_THEM_ALL } as GeolocationPosition));
  try {
    expect(asked).not.toHaveBeenCalled();
    clickButton(root, "My location");
    await expect.poll(() => labelsIn(root)).toEqual(NEAREST_FIRST);
    expect(asked).toHaveBeenCalledOnce();
    expect(root.querySelectorAll(".maplace-distance")).toHaveLength(ALL.length);

    type("harbour");
    await expect.poll(() => labelsIn(root)).toEqual(["Genoa", "Bari", "Naples"]);
    type("");
    await expect.poll(() => labelsIn(root)).toEqual(NEAREST_FIRST);

    clickButton(root, "My location");
    await expect.poll(() => listedIn(root)).toEqual(ALL);
    expect(root.querySelector(".maplace-distance")).toBeNull();
  } finally {
    asked.mockRestore();
  }
};

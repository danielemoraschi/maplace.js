import { expect, vi } from "vitest";
import {
  clickButton,
  controlPositions,
  type ExampleBehaviour,
  labelsIn,
  listedIn,
} from "./reading";

const ALL = ["Rome", "Naples", "Bologna", "Milan", "Turin"];

/** Oslo: every place south of it, so the nearest are in the North, then Centre, then South. */
const ABOVE_THEM_ALL = { latitude: 59.91, longitude: 10.75 };
const NEAREST_FIRST = ["Milan", "Turin", "Bologna", "Rome", "Naples"];

/**
 * A "My location" button on the map asks for the position only when pressed and sorts the list
 * nearest first, each entry saying how far; pressed again, the list goes back.
 */
export const nearest: ExampleBehaviour = async ({ adapter, root }) => {
  expect(controlPositions(adapter)).toEqual(["top-left"]);
  await expect.poll(() => listedIn(root)).toEqual(ALL);

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

    clickButton(root, "My location");
    await expect.poll(() => listedIn(root)).toEqual(ALL);
    expect(root.querySelector(".maplace-distance")).toBeNull();
  } finally {
    asked.mockRestore();
  }
};

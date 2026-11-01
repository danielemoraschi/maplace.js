import { expect } from "vitest";
import type { ExampleBehaviour } from "./reading";

const FIRST_CLICK = { lat: 43.1, lng: 13.4 };
const DRAGGED_TO = { lat: 44.2, lng: 11.3 };
const SECOND_CLICK = { lat: 40.5, lng: 16.5 };

/** A click on the map adds a pin; it drags, and stays where it was dragged as the next one lands. */
export const clickToAdd: ExampleBehaviour = async ({ store, adapter }) => {
  const probe = adapter.probe();
  const located = (id: string) => store.getSnapshot().locations.find((place) => place.id === id);
  probe.clickMap(FIRST_CLICK);
  await expect.poll(() => located("pin-1")).toMatchObject(FIRST_CLICK);
  await expect.poll(() => probe.location("pin-1")).toBeDefined();

  probe.drag("pin-1", { type: "marker", ...DRAGGED_TO });
  await expect.poll(() => located("pin-1")).toMatchObject(DRAGGED_TO);

  probe.clickMap(SECOND_CLICK);
  await expect.poll(() => located("pin-2")).toMatchObject(SECOND_CLICK);
  expect(located("pin-1")).toMatchObject(DRAGGED_TO);
};

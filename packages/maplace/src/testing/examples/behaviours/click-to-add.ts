import { expect } from "vitest";
import { type ExampleBehaviour, firstView } from "./reading";

const FIRST_VIEW = { kind: "center", center: { lat: 44, lng: 11 }, zoom: 6 };
const FIRST_CLICK = { lat: 43.1, lng: 13.4 };
const DRAGGED_TO = { lat: 44.2, lng: 11.3 };
const SECOND_CLICK = { lat: 42.4, lng: 14.2 };

/** The map opens on Italy's north; a click adds a pin, which drags and stays as the next lands. */
export const clickToAdd: ExampleBehaviour = async ({ store, adapter }) => {
  expect(firstView(adapter)).toEqual(FIRST_VIEW);
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

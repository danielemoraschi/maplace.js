import { expect, vi } from "vitest";
import type { ExampleBehaviour } from "./reading";

export const polygon: ExampleBehaviour = async ({ store, adapter }) => {
  const saved: unknown[] = [];
  vi.stubGlobal("save", (location: unknown) => saved.push(location));
  adapter.probe().drag("park", {
    type: "polygon",
    path: [
      { lat: 51.503, lng: -0.175 },
      { lat: 51.52, lng: -0.16 },
      { lat: 51.503, lng: -0.155 },
    ],
  });
  await expect.poll(() => saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ id: "park" });
  expect(store.getSnapshot().locations[0]).toMatchObject({ id: "park" });
};

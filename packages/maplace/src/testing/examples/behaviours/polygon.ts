import { expect, vi } from "vitest";
import type { ExampleBehaviour } from "./reading";

export const polygon: ExampleBehaviour = async ({ store, adapter }) => {
  const saved: unknown[] = [];
  vi.stubGlobal("save", (location: unknown) => saved.push(location));
  adapter.probe().drag("park", {
    type: "polygon",
    path: [
      { lat: 41.9, lng: 12.48 },
      { lat: 41.93, lng: 12.49 },
      { lat: 41.9, lng: 12.5 },
    ],
  });
  await expect.poll(() => saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ id: "park" });
  expect(store.getSnapshot().locations[0]).toMatchObject({ id: "park" });
};

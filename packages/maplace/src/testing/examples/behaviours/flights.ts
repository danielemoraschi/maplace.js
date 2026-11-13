import { expect } from "vitest";
import { byText, type ExampleBehaviour, labelsIn } from "./reading";

const CITIES = [
  "New York",
  "São Paulo",
  "Cape Town",
  "Dubai",
  "Mumbai",
  "Singapore",
  "Tokyo",
  "Sydney",
];

export const flights: ExampleBehaviour = async ({ store, adapter, root }) => {
  // The list holds the flights, not the cities, which are on the map only.
  await expect.poll(() => labelsIn(root)).toEqual(CITIES.map((city) => `London → ${city}`));
  const probe = adapter.probe();
  for (const city of ["london", "tokyo"]) expect(probe.location(city)).toBeDefined();
  // Each flight follows its great circle: London to Tokyo's middle is near 69° north.
  const drawn = probe.location("london-tokyo")?.geometry;
  const path = drawn?.type === "polyline" ? drawn.path : [];
  expect(path[path.length >> 1]?.lat).toBeGreaterThan(65);
  byText(root, "[role=option]", "London → Tokyo").click();
  await expect.poll(() => store.getSnapshot().selectedId).toBe("london-tokyo");
};

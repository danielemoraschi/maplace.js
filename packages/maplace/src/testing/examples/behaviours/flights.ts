import { expect } from "vitest";
import type { LatLng } from "../../../geometry";
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
  // Each flight is drawn as an arc: its middle north of both ends, London and Tokyo.
  const drawn = probe.location("london-tokyo")?.geometry;
  const path = drawn?.type === "polyline" ? drawn.path : [];
  const [london, middle, tokyo] = [path[0], path[path.length >> 1], path.at(-1)] as LatLng[];
  expect(middle?.lat).toBeGreaterThan(Math.max(london?.lat ?? 90, tokyo?.lat ?? 90));
  byText(root, "[role=option]", "London → Tokyo").click();
  await expect.poll(() => store.getSnapshot().selectedId).toBe("london-tokyo");
};

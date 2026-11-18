import { expect } from "vitest";
import type { MarkerLocation, PolylineLocation } from "../../../location";
import { locationById } from "../../../location-index";
import { byText, type ExampleBehaviour, inputLabelled, labelsIn, slideTo } from "./reading";

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
  // The scheduled flights are dashed.
  expect(probe.location("london-cape-town")?.style).toMatchObject({ strokeDash: "dashed" });
  expect(probe.location("london-tokyo")?.style?.strokeDash).not.toBe("dashed");
  // The flight in the air: active, travelled as far as the slider says, its plane drawn where it
  // is, moving with it.
  const located = <T>(id: string) => locationById(store.getSnapshot().locations, id) as T;
  const plane = () => located<MarkerLocation>("plane");
  const planeDrawn = () => probe.location("plane")?.geometry;
  expect(located<PolylineLocation>("london-new-york")).toMatchObject({
    active: true,
    progress: 0.4,
  });
  await expect.poll(plane).toBeDefined();
  const before = plane();
  expect(planeDrawn()).toMatchObject({ lat: before.lat, lng: before.lng });
  slideTo(inputLabelled(root, "London → New York, flown"), "0.8");
  await expect.poll(() => located<PolylineLocation>("london-new-york").progress).toBe(0.8);
  expect(plane().lng).toBeLessThan(before.lng);
  await expect.poll(planeDrawn).toMatchObject({ lat: plane().lat, lng: plane().lng });
  byText(root, "[role=option]", "London → Tokyo").click();
  await expect.poll(() => store.getSnapshot().selectedId).toBe("london-tokyo");
};

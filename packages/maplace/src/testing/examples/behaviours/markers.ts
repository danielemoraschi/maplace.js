import { expect } from "vitest";
import type { ExampleBehaviour } from "./reading";

/** Image icons for three cities, a DOM one for Cardiff, and Edinburgh shown at its own zoom. */
export const markers: ExampleBehaviour = async ({ store, adapter }) => {
  const probe = adapter.probe();
  const srcOf = (id: string) =>
    (probe.location(id)?.icon as Element | undefined)?.getAttribute("src");
  expect(["london", "edinburgh", "manchester"].map(srcOf)).toEqual([
    "/examples/data/icons/a.svg",
    "/examples/data/icons/b.svg",
    "/examples/data/icons/c.svg",
  ]);
  expect(probe.location("cardiff")?.icon?.textContent).toBe("★");
  store.select("edinburgh");
  expect(adapter.callsOf("setView").at(-1)?.view).toEqual({
    kind: "location",
    id: "edinburgh",
    zoom: 8,
  });
};

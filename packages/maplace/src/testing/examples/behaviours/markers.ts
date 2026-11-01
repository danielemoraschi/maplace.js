import { expect } from "vitest";
import type { ExampleBehaviour } from "./reading";

/** Image icons for three cities, a DOM one for Venice, and Milan shown at its own zoom. */
export const markers: ExampleBehaviour = async ({ store, adapter }) => {
  const probe = adapter.probe();
  const srcOf = (id: string) =>
    (probe.location(id)?.icon as Element | undefined)?.getAttribute("src");
  expect(["rome", "milan", "naples"].map(srcOf)).toEqual([
    "/icons/a.svg",
    "/icons/b.svg",
    "/icons/c.svg",
  ]);
  expect(probe.location("venice")?.icon?.textContent).toBe("★");
  store.select("milan");
  expect(adapter.callsOf("setView").at(-1)?.view).toEqual({
    kind: "location",
    id: "milan",
    zoom: 8,
  });
};

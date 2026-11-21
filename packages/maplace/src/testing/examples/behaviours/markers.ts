import { expect } from "vitest";
import type { ExampleBehaviour } from "./reading";

/**
 * The map's pin for Edinburgh and Manchester, London's own image, Cardiff's own markup, and
 * Edinburgh shown at its own zoom.
 */
export const markers: ExampleBehaviour = async ({ store, adapter }) => {
  const probe = adapter.probe();
  const iconOf = (id: string) => probe.location(id)?.icon as Element | undefined;
  expect(iconOf("london")?.getAttribute("src")).toBe("/examples/data/icons/a.svg");
  for (const id of ["edinburgh", "manchester"]) {
    expect(iconOf(id)?.querySelector("path"), id).not.toBeNull();
  }
  expect(iconOf("edinburgh")).not.toBe(iconOf("manchester"));
  expect(iconOf("cardiff")?.textContent).toBe("★");
  store.select("edinburgh");
  expect(adapter.callsOf("setView").at(-1)?.view).toEqual({
    kind: "location",
    id: "edinburgh",
    zoom: 8,
  });
};

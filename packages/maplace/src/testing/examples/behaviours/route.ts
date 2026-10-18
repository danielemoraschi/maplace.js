import { expect } from "vitest";
import { type ExampleBehaviour, textIn } from "./reading";

export const route: ExampleBehaviour = async ({ store, adapter, root }) => {
  // A route set by a prop arrives after the map opens: the fake reports one on a settle.
  await expect
    .poll(async () => {
      await adapter.probe().settle();
      return store.getSnapshot().routeResult?.legs.map(({ from, to }) => [from, to]);
    })
    .toEqual([
      ["milan", "paris"],
      ["paris", "munich"],
    ]);
  const steps = store.getSnapshot().routeResult?.legs.flatMap((leg) => leg.steps) ?? [];
  // Zurich is passed through on the way to Paris: two steps in the first leg.
  expect(steps).toHaveLength(3);
  await expect.poll(() => root.querySelectorAll("ol > li").length).toBe(steps.length);
  expect(root.querySelectorAll("ol")).toHaveLength(2);
  expect(root.textContent).toMatch(/Milan → Paris, \d+ km/);
  expect(root.textContent).toMatch(/Paris → Munich, \d+ km/);
  expect(textIn(root, "ol > li")).toBe(steps[0]?.instruction);
  await expect.poll(() => textIn(root, "output")).toMatch(/^\d+ km$/);
};

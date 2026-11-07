import { expect } from "vitest";
import type { ExampleBehaviour } from "./reading";

/**
 * Its map opened, a version by the press its runner makes, a page by `release()`: the panel is
 * gone with its button, its places drawn. `apps/site/test/examples-on-maplibre.test.ts` presses
 * the page's.
 */
export const loadOnDemand: ExampleBehaviour = async ({ adapter, root }) => {
  expect(Array.from(root.querySelectorAll("button"), (button) => button.textContent)).not.toContain(
    "Load map",
  );
  expect(root.querySelector(".load-panel")).toBeNull();
  expect(adapter.probe().locationIds()).toHaveLength(3);
};

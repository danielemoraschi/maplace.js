import { expect } from "vitest";
import { byText, type ExampleBehaviour, lastFit, listedIn } from "./reading";

const LISTED = [
  "All countries",
  "United States of America30%",
  "India20%",
  "United Kingdom20%",
  "Brazil10%",
  "Saudi Arabia10%",
  "Australia10%",
];

/**
 * Six countries in their colours, each with a badge of its share, and the list as the legend in
 * the shares' order after an entry showing them all, each entry's dots filled to its share; a
 * click on a badge picks its country, and the first entry fits them all again.
 */
export const shareByCountry: ExampleBehaviour = async ({ store, adapter, root }) => {
  const probe = adapter.probe();
  await expect.poll(() => listedIn(root)).toEqual(LISTED);
  const unitedStates = byText(root, '[role="option"]', "United States of America30%");
  expect(unitedStates.querySelectorAll(".share-dot[data-filled]")).toHaveLength(3);
  expect(probe.location("USA")?.geometry.type).toBe("multipolygon");
  expect(probe.location("USA")?.style?.fill).toBe("#1d4ed8");
  expect(probe.location("USA-badge")?.icon?.textContent).toBe("30%");

  probe.click("BRA-badge");
  await expect.poll(() => store.getSnapshot().selectedId).toBe("BRA");
  expect(store.getSnapshot().view).toMatchObject({ kind: "location", id: "BRA" });

  byText(root, '[role="option"]', "All countries").click();
  await expect.poll(() => store.getSnapshot().selectedId).toBeUndefined();
  await expect.poll(() => lastFit(adapter)).toBeDefined();
};

import { expect } from "vitest";
import { type ExampleBehaviour, textsIn } from "./reading";

export const tradeLanes: ExampleBehaviour = async ({ store, adapter, root }) => {
  // Listed under their modes.
  await expect.poll(() => textsIn(root, ".maplace-group-heading")).toEqual(["Sea", "Air"]);
  const probe = adapter.probe();
  // Hovered, a lane is drawn wider; selected, wider still.
  expect(probe.location("frankfurt-chicago")?.style?.strokeWidth).toBeUndefined();
  probe.pointerOver("frankfurt-chicago");
  await expect.poll(() => probe.location("frankfurt-chicago")?.style?.strokeWidth).toBe(5);
  probe.pointerOut();
  // Picked, its popup gives its volume.
  probe.click("shanghai-los-angeles");
  await expect.poll(() => store.getSnapshot().selectedId).toBe("shanghai-los-angeles");
  expect(probe.location("shanghai-los-angeles")?.style?.strokeWidth).toBe(6);
  await probe.settle();
  await expect.poll(() => probe.shownPopup()?.element.textContent).toContain("24,800 TEU a week");
  // Across the Pacific, the short way: drawn on both sides of ±180.
  const drawn = probe.location("shanghai-los-angeles")?.geometry;
  const longitudes = drawn?.type === "polyline" ? drawn.path.map(({ lng }) => lng) : [];
  expect(longitudes.some((lng) => lng > 170)).toBe(true);
  expect(longitudes.some((lng) => lng < -170)).toBe(true);
};

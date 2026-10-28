import { expect } from "vitest";
import type { ExampleBehaviour } from "./reading";

const MARKS = ["data-hovered", "data-selected"] as const;

/** The marks maplace sets on a marker's icon, which the page's CSS gives each state's look by. */
function marksOn(icon: Node | undefined): string[] {
  if (!(icon instanceof Element)) return [];
  return MARKS.filter((mark) => icon.hasAttribute(mark));
}

/** Each pin is the page's own, marked hovered while pointed at and selected once picked. */
export const cssMarkers: ExampleBehaviour = async ({ store, adapter }) => {
  const probe = adapter.probe();
  expect(probe.location("rijks")?.icon?.textContent).toBe("Rijks");
  probe.pointerOver("nemo");
  await probe.settle();
  expect(marksOn(probe.location("nemo")?.icon)).toEqual(["data-hovered"]);
  probe.pointerOut();
  store.select("rijks");
  await probe.settle();
  expect(marksOn(probe.location("rijks")?.icon)).toEqual(["data-selected"]);
  expect(marksOn(probe.location("nemo")?.icon)).toEqual([]);
};

import { expect } from "vitest";
import { SELECTED_LOOK } from "../../../adapter-kit/shape-looks";
import { type BoundsView, type ExampleBehaviour, latitudeSpanOf, textIn } from "./reading";

export const circles: ExampleBehaviour = async (run) => {
  await expectPopups(run);
  await expectFitsAndStyles(run);
  await expectRadiusReadout(run);
};

/** The centre is selected at start, its popup open; the ring's opens on a click. */
const expectPopups: ExampleBehaviour = async ({ store, adapter }) => {
  const probe = adapter.probe();
  expect(store.getSnapshot().selectedId).toBe("center");
  await probe.settle();
  await expect.poll(() => textIn(probe.shownPopup()?.element, "strong")).toBe("Within 5 km");
  probe.click("ring");
  await probe.settle();
  await expect.poll(() => textIn(probe.shownPopup()?.element, "strong")).toBe("Within 15 km");
};

/** Each circle is fitted when selected, drawn in its own colours, the selected one heavier. */
const expectFitsAndStyles: ExampleBehaviour = async ({ store, adapter }) => {
  store.select("ring");
  store.select("center");
  const [ring, center] = adapter
    .callsOf("setView")
    .slice(-2)
    .map(({ view }) => view as BoundsView);
  expect([ring?.kind, center?.kind]).toEqual(["fit-bounds", "fit-bounds"]);
  expect(latitudeSpanOf(ring)).toBeGreaterThan(latitudeSpanOf(center));
  const probe = adapter.probe();
  expect(probe.location("ring")?.style).toMatchObject({ stroke: "#15803d", fill: "#22c55e" });
  expect(probe.location("center")?.style).toMatchObject({
    ...SELECTED_LOOK,
    stroke: "#c2410c",
    fill: "#f97316",
  });
};

/** Resizing the editable circle shows its radius. */
const expectRadiusReadout: ExampleBehaviour = async ({ adapter, root }) => {
  const resizable = adapter.probe().location("resizable")?.geometry;
  if (resizable?.type !== "circle") throw new Error("no resizable circle");
  adapter.probe().drag("resizable", { ...resizable, radius: 20_000 });
  await expect.poll(() => textIn(root, "output")).toBe("Radius: 20.0 km");
};

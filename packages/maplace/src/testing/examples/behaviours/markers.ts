import { expect } from "vitest";
import { controlPositions, type ExampleBehaviour, listIn, textIn } from "./reading";

const DROP = { lat: 43.1, lng: 13.4 };

export const markers: ExampleBehaviour = async (run) => {
  await expectIcons(run);
  await expectPopups(run);
  await expectListAndZoom(run);
  await expectMapClickDrops(run);
};

/** Image icons for three cities, a DOM one for Venice. */
const expectIcons: ExampleBehaviour = async ({ adapter }) => {
  const probe = adapter.probe();
  const srcOf = (id: string) =>
    (probe.location(id)?.icon as Element | undefined)?.getAttribute("src");
  expect(["rome", "milan", "naples"].map(srcOf)).toEqual([
    "/icons/a.svg",
    "/icons/b.svg",
    "/icons/c.svg",
  ]);
  expect(probe.location("venice")?.icon?.textContent).toBe("★");
};

/** Rome's popup shows, and a click on Naples, which has none, shows none. */
const expectPopups: ExampleBehaviour = async ({ adapter }) => {
  const probe = adapter.probe();
  probe.click("rome");
  await probe.settle();
  await expect.poll(() => textIn(probe.shownPopup()?.element, "strong")).toBe("Rome");
  expect(probe.shownPopup()?.element.textContent).toContain("Capital of Italy.");
  probe.click("naples");
  await probe.settle();
  await expect.poll(() => probe.shownPopup()).toBeUndefined();
};

/** The list is on the map under its heading, Florence on the map only; Milan has its own zoom. */
const expectListAndZoom: ExampleBehaviour = async ({ store, adapter, root }) => {
  expect(controlPositions(adapter)).toEqual(["top-right"]);
  await expect.poll(() => listIn(root)?.textContent).toContain("Choose a location:");
  expect(listIn(root)?.textContent).toContain("Rome");
  expect(adapter.probe().location("florence")).toBeDefined();
  expect(listIn(root)?.textContent).not.toContain("Florence");
  store.select("milan");
  expect(adapter.callsOf("setView").at(-1)?.view).toEqual({
    kind: "location",
    id: "milan",
    zoom: 8,
  });
};

/** A click on the map drops a marker there. */
const expectMapClickDrops: ExampleBehaviour = async ({ store, adapter }) => {
  adapter.probe().clickMap(DROP);
  await expect
    .poll(() => store.getSnapshot().locations.find(({ id }) => id === "dropped-1"))
    .toMatchObject(DROP);
  await expect.poll(() => adapter.probe().location("dropped-1")).toBeDefined();
};

import { expect } from "vitest";
import {
  byText,
  chooseOption,
  type ExampleBehaviour,
  listedIn,
  selectedEntryIn,
  textIn,
} from "./reading";

const REGIONS = 6;

/**
 * A streaming service's viewers by region: a card per region on the map and an entry in the list,
 * the arcs and the studio unlisted, the total under the map; another period swaps every figure and keeps
 * the selection, and a click on an arc selects its region and the map goes to it.
 */
export const audience: ExampleBehaviour = async ({ store, adapter, root }) => {
  const probe = adapter.probe();
  await expect.poll(() => listedIn(root)).toHaveLength(REGIONS);
  expect(probe.location("north-america")?.icon?.textContent).toBe("AAction2.2M");
  expect(probe.location("north-america-arc")?.geometry.type).toBe("polyline");
  await expect.poll(() => textIn(root, "output")).toBe("17,790,329");

  byText(root, '[role="option"]', "North America2.2MAction13%").click();
  await expect.poll(() => store.getSnapshot().selectedId).toBe("north-america");

  chooseOption(root, "Period", "Last month");
  await expect.poll(() => textIn(root, "output")).toBe("1,507,750");
  await expect.poll(() => probe.location("north-america")?.icon?.textContent).toBe("AAction198.4K");
  expect(selectedEntryIn(root)?.textContent).toBe("North America198.4KAction13%");
  expect(store.getSnapshot().selectedId).toBe("north-america");

  probe.click("oceania-arc");
  await expect.poll(() => store.getSnapshot().selectedId).toBe("oceania");
  expect(adapter.callsOf("setView").at(-1)?.view).toMatchObject({
    kind: "location",
    id: "oceania",
  });
};

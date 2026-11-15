import { expect } from "vitest";
import { chooseOption, controlPositions, type ExampleBehaviour } from "./reading";

/** The countries in countries.json: Natural Earth's 177, Antarctica left out. */
const COUNTRIES = 176;

/**
 * Every country shaded, the United States one multipolygon; hovering France opens its value, and
 * the legend's select, in the bottom-left corner, picks it.
 */
export const choropleth: ExampleBehaviour = async ({ store, adapter, root }) => {
  await expect.poll(() => store.getSnapshot().locations.length).toBe(COUNTRIES);
  const probe = adapter.probe();
  expect(probe.location("USA")?.geometry.type).toBe("multipolygon");
  expect(probe.location("FRA")?.style?.fill).toMatch(/^#[0-9a-f]{6}$/);
  expect(controlPositions(adapter)).toContain("bottom-left");
  probe.pointerOver("FRA");
  await probe.settle();
  await expect.poll(() => probe.shownPopup()?.heading).toBe("France");
  expect(probe.shownPopup()?.element.textContent).toMatch(/^\$[\d,]+ per person$/);
  chooseOption(root, "Country", "France");
  await expect.poll(() => store.getSnapshot().selectedId).toBe("FRA");
};

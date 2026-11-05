import { expect } from "vitest";
import type { Maplace } from "../../../index";
import type { FakeAdapter } from "../../fake-adapter";
import {
  byText,
  controlPositions,
  type ExampleBehaviour,
  firstView,
  textIn,
  textsIn,
} from "./reading";

const PICK_A_VENUE = "Pick a venue on the map to see it here.";
const ROYAL_ALBERT_HALL = [
  "Concerts",
  "Royal Albert Hall",
  "Kensington Gore, London SW7 2AP",
  "1871",
  "The BBC Proms, every summer",
];

const CATEGORY_OF: Readonly<Record<string, string>> = {
  "national-theatre": "Theatre",
  "royal-albert-hall": "Concerts",
  "borough-market": "Markets",
  "british-library": "Talks",
};

/** The category on the icon drawn for `id`, on the pin itself or on one inside it. */
function iconCategoryOf(adapter: FakeAdapter, id: string): string | undefined {
  const icon = adapter.probe().location(id)?.icon;
  if (!(icon instanceof Element)) return undefined;
  const pin = icon.matches("[data-category]") ? icon : icon.querySelector("[data-category]");
  return pin instanceof HTMLElement ? pin.dataset.category : undefined;
}

/**
 * The page's legend, a list view the element builds again when a list attribute changes, shows
 * the filter it finds: "Markets" still pressed once rebuilt elsewhere and back.
 */
async function expectLegendRebuiltPressed(root: Element): Promise<void> {
  const map = root.querySelector("maplace-map");
  if (map === null) return;
  for (const corner of ["bottom-right", "bottom-left"]) {
    map.setAttribute("list-position", corner);
    await expect.poll(() => pressedIn(root)).toEqual(["Markets"]);
  }
}

/**
 * The venue selected is named in the pill beside the count, and shown in the card beside the map:
 * its category, name, address, year and what it is known for, both marked with the category for its
 * colour. Unselected, the pill goes and the card asks for a venue again.
 */
async function expectSelectionShown(store: Maplace, root: Element): Promise<void> {
  const named = () => textIn(root, ".event-selected:not([hidden])");
  const shown = () => textsIn(root, ".venue :is(.venue-category, .venue-name, dd)");
  const asking = () => textIn(root, ".venue-empty:not([hidden])");
  expect(named()).toBeUndefined();
  expect(shown()).toEqual([]);
  expect(asking()).toBe(PICK_A_VENUE);
  store.select("royal-albert-hall");
  await expect.poll(named).toBe("Royal Albert Hall");
  await expect.poll(shown).toEqual(ROYAL_ALBERT_HALL);
  expect(asking()).toBeUndefined();
  for (const marked of root.querySelectorAll<HTMLElement>(".event-selected, .venue")) {
    expect(marked.dataset.category).toBe("Concerts");
  }
  store.select(undefined);
  await expect.poll(named).toBeUndefined();
  await expect.poll(shown).toEqual([]);
  expect(asking()).toBe(PICK_A_VENUE);
}

/** The chips pressed inside `root`, by their words. */
const pressedIn = (root: Element) => textsIn(root, 'button[aria-pressed="true"]');

/**
 * Every venue fitted with room for the controls; the legend on the map's bottom left, the count on
 * its top left (on the map, or over it in the page), the venue selected named beside it and shown
 * in the card beside the map; pins marked with their category. A chip shows its category alone,
 * the count following; pressed again, every venue is back. The chip pressed stays the node pressed.
 */
export const whatsOn: ExampleBehaviour = async ({ store, adapter, root }) => {
  expect(firstView(adapter)).toMatchObject({ padding: 80 });
  const countOnMap = adapter.mounted?.container.querySelector(".event-count") != null;
  expect(controlPositions(adapter)).toEqual(
    countOnMap ? ["bottom-left", "top-left"] : ["bottom-left"],
  );
  for (const [id, category] of Object.entries(CATEGORY_OF)) {
    expect(iconCategoryOf(adapter, id)).toBe(category);
  }
  await expect.poll(() => textIn(root, ".event-count")).toBe("12 venues");
  await expectSelectionShown(store, root);
  expect(textsIn(root, "button[aria-pressed]")).toEqual(Object.values(CATEGORY_OF));
  expect(pressedIn(root)).toEqual([]);

  const markets = byText(root, "button", "Markets");
  markets.click();
  expect(store.getSnapshot().filter?.groups).toEqual(["Markets"]);
  await expect.poll(() => textIn(root, ".event-count")).toBe("3 of 12 venues");
  await expect.poll(() => pressedIn(root)).toEqual(["Markets"]);
  expect(markets.isConnected).toBe(true);
  await expectLegendRebuiltPressed(root);

  byText(root, "button", "Markets").click();
  expect(store.getSnapshot().filter).toBeUndefined();
  await expect.poll(() => textIn(root, ".event-count")).toBe("12 venues");
  await expect.poll(() => pressedIn(root)).toEqual([]);
};

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

const PICK_A_VENUE = "Pick a venue on the map, or here.";
const VENUES = [
  "National Theatre",
  "Shakespeare's Globe",
  "Donmar Warehouse",
  "Royal Albert Hall",
  "Wigmore Hall",
  "Barbican Hall",
  "Borough Market",
  "Camden Market",
  "Old Spitalfields Market",
  "British Library",
  "Conway Hall",
  "Royal Institution",
];
const MARKETS = ["Borough Market", "Camden Market", "Old Spitalfields Market"];
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

/** The category the card's list says it shows alone, if any. */
const listedCategoryIn = (root: Element) =>
  textIn(root, ".venue-picker:not([hidden]) .venue-list-category:not([hidden])");

/** The venues the card lists, by their words; none while a venue is selected. */
const venuesListedIn = (root: Element) => textsIn(root, ".venue-picker:not([hidden]) .venue-pick");

/** The venue the card shows: its category, name, address, year and what it is known for. */
const shownIn = (root: Element) => textsIn(root, ".venue :is(.venue-category, .venue-name, dd)");

/**
 * The venue selected is named in the pill beside the count, and shown in the card beside the map:
 * its category, name, address, year and what it is known for, both marked with the category for its
 * colour, in place of the card's list of venues. Unselected, the pill goes and the list is back.
 */
async function expectSelectionShown(store: Maplace, root: Element): Promise<void> {
  const named = () => textIn(root, ".event-selected:not([hidden])");
  const asking = () => textIn(root, ".venue-picker:not([hidden]) .venue-empty");
  expect(named()).toBeUndefined();
  expect(shownIn(root)).toEqual([]);
  expect(asking()).toBe(PICK_A_VENUE);
  expect(venuesListedIn(root)).toEqual(VENUES);
  expect(listedCategoryIn(root)).toBeUndefined();
  store.select("royal-albert-hall");
  await expect.poll(named).toBe("Royal Albert Hall");
  await expect.poll(() => shownIn(root)).toEqual(ROYAL_ALBERT_HALL);
  expect(asking()).toBeUndefined();
  expect(venuesListedIn(root)).toEqual([]);
  for (const marked of root.querySelectorAll<HTMLElement>(".event-selected, .venue")) {
    expect(marked.dataset.category).toBe("Concerts");
  }
  store.select(undefined);
  await expect.poll(named).toBeUndefined();
  await expect.poll(() => shownIn(root)).toEqual([]);
  expect(asking()).toBe(PICK_A_VENUE);
  expect(venuesListedIn(root)).toEqual(VENUES);
}

/**
 * A venue picked from the card's list is selected and shown, the focus moved to the card's ×;
 * pressed, it clears the selection and the focus goes back to that venue in the list.
 */
async function expectPickedFromList(store: Maplace, root: Element): Promise<void> {
  const focused = () => root.ownerDocument.activeElement;
  byText(root, ".venue-pick", "Wigmore Hall").click();
  expect(store.getSnapshot().selectedId).toBe("wigmore-hall");
  await expect.poll(() => shownIn(root)[1]).toBe("Wigmore Hall");
  const close = root.querySelector<HTMLElement>(".venue-close");
  expect(focused()).toBe(close);
  close?.click();
  expect(store.getSnapshot().selectedId).toBeUndefined();
  await expect.poll(() => venuesListedIn(root)).toEqual(VENUES);
  expect(focused()?.textContent?.trim()).toBe("Wigmore Hall");
}

/** The dark of the frame, `#1c1d21` in whats-on.css, as a browser computes it. */
const FRAME_BACKGROUND = "rgb(28, 29, 33)";

/** The frame is drawn dark: the example's stylesheet, which every version links, applies. */
function expectStylesheetApplied(root: Element): void {
  const frame = root.querySelector(".whats-on");
  expect(frame, "the version's frame, .whats-on").not.toBeNull();
  expect(getComputedStyle(frame as Element).backgroundColor).toBe(FRAME_BACKGROUND);
}

/** The chips pressed inside `root`, by their words. */
const pressedIn = (root: Element) => textsIn(root, 'button[aria-pressed="true"]');

/**
 * Every venue fitted with room for the controls; the legend on the map's bottom left, the count on
 * its top left (on the map, or over it in the page), the venue selected named beside it and shown
 * in the card beside the map, which lists the venues shown while none is; pins marked with their
 * category. A chip shows its category alone, the count and the card's list following, the list
 * named by it; pressed again, every venue is back. The chip pressed stays the node pressed.
 */
export const whatsOn: ExampleBehaviour = async ({ store, adapter, root }) => {
  expectStylesheetApplied(root);
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
  await expectPickedFromList(store, root);
  expect(textsIn(root, "button[aria-pressed]")).toEqual(Object.values(CATEGORY_OF));
  expect(pressedIn(root)).toEqual([]);

  const markets = byText(root, "button", "Markets");
  markets.click();
  expect(store.getSnapshot().filter?.groups).toEqual(["Markets"]);
  await expect.poll(() => textIn(root, ".event-count")).toBe("3 of 12 venues");
  await expect.poll(() => pressedIn(root)).toEqual(["Markets"]);
  await expect.poll(() => venuesListedIn(root)).toEqual(MARKETS);
  expect(listedCategoryIn(root)).toBe("Markets");
  expect(root.querySelector<HTMLElement>(".venue-list-category")?.dataset.category).toBe("Markets");
  expect(markets.isConnected).toBe(true);
  await expectLegendRebuiltPressed(root);

  byText(root, "button", "Markets").click();
  expect(store.getSnapshot().filter).toBeUndefined();
  await expect.poll(() => textIn(root, ".event-count")).toBe("12 venues");
  await expect.poll(() => pressedIn(root)).toEqual([]);
  await expect.poll(() => venuesListedIn(root)).toEqual(VENUES);
  expect(listedCategoryIn(root)).toBeUndefined();
};

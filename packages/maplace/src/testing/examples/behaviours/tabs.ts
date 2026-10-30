import { expect } from "vitest";
import { byText, type ExampleBehaviour, listIn, textIn } from "./reading";

/** The tab marked chosen inside `root`. */
function chosenTab(root: Element): HTMLElement | null {
  return root.querySelector('[role="option"][aria-selected="true"]');
}

const tabIn = (root: Element, text: string) => byText(root, '[role="option"]', text);

/** `chosen` bordered as a tab opening onto the map (no bottom edge), `other` with no border shown. */
function expectDrawnAsTabs(chosen: HTMLElement, other: HTMLElement): void {
  const style = getComputedStyle(chosen);
  expect([style.borderTopStyle, style.borderBottomStyle]).toEqual(["solid", "none"]);
  expect(getComputedStyle(other).borderTopColor).toBe("rgba(0, 0, 0, 0)");
}

/** The tabs fit their row: none overflows it, so it shows no scrollbar. */
function expectTabsFitTheirRow(root: Element): void {
  const row = listIn(root);
  expect(row && row.scrollHeight - row.clientHeight).toBe(0);
}

/** The chosen tab's details laid out right below the tabs, above the map, as 0.2's tabs were. */
function expectDetailsBetweenTabsAndMap(root: Element, map: Element | undefined): void {
  const tabs = listIn(root)?.getBoundingClientRect();
  const details = root.querySelector("aside")?.getBoundingClientRect();
  const mapBox = map?.getBoundingClientRect();
  expect(details?.top).toBeGreaterThanOrEqual(tabs?.bottom ?? Number.POSITIVE_INFINITY);
  expect(mapBox?.top).toBeGreaterThanOrEqual(details?.bottom ?? Number.POSITIVE_INFINITY);
}

/**
 * Tabs that start on the first place, its details shown right below them, and follow the selection
 * after, each place shown at its own zoom.
 */
export const tabs: ExampleBehaviour = async ({ store, adapter, root }) => {
  expect(store.getSnapshot().selectedId).toBe("rome");
  expect(store.getSnapshot().locations.map(({ zoom }) => zoom)).toEqual([6, 6]);
  await expect.poll(() => chosenTab(root)?.textContent).toBe("Rome");
  await expect.poll(() => textIn(root, "aside")).toBe("Capital since 1871.");
  expectDrawnAsTabs(tabIn(root, "Rome"), tabIn(root, "Milan"));
  expectTabsFitTheirRow(root);
  expectDetailsBetweenTabsAndMap(root, adapter.mounted?.container);
  store.select("milan");
  expect(adapter.callsOf("setView").at(-1)?.view).toEqual({
    kind: "location",
    id: "milan",
    zoom: 6,
  });
  await expect.poll(() => textIn(root, "aside")).toBe("Finance and fashion.");
  await expect.poll(() => chosenTab(root)?.textContent).toBe("Milan");
};

import { expect } from "vitest";
import { byText, type ExampleBehaviour, textIn } from "./reading";

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

/** Tabs that start on the first place, its details shown, and follow the selection after. */
export const tabs: ExampleBehaviour = async ({ store, root }) => {
  expect(store.getSnapshot().selectedId).toBe("rome");
  await expect.poll(() => chosenTab(root)?.textContent).toBe("Rome");
  await expect.poll(() => textIn(root, "aside")).toBe("Capital since 1871.");
  expectDrawnAsTabs(tabIn(root, "Rome"), tabIn(root, "Milan"));
  store.select("milan");
  await expect.poll(() => textIn(root, "aside")).toBe("Finance and fashion.");
  await expect.poll(() => chosenTab(root)?.textContent).toBe("Milan");
};

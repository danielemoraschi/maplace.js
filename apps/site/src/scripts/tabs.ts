import { reveal } from "./reveal.ts";

/** The key that moves the selection, and where to, from the tab at `index` of `count`. */
const MOVES: Readonly<Record<string, (index: number, count: number) => number>> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_, count) => count - 1,
};

/**
 * Every `role="tablist"` under `root` as ARIA tabs: a click or an arrow key selects a tab and
 * shows its panel (`aria-controls`), fading it in, the others hidden at once; only the selected
 * tab is in the Tab order, and the arrow keys pass over a disabled one.
 * The page renders the first tab selected.
 */
export function startTabs(root: ParentNode): void {
  for (const list of root.querySelectorAll('[role="tablist"]')) {
    const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
    const select = (chosen: HTMLElement) => {
      for (const tab of tabs) showTab(tab, tab === chosen);
    };
    for (const [index, tab] of tabs.entries()) {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (event) => {
        const next = nextTab(tabs, index, MOVES[event.key]);
        if (!next) return;
        event.preventDefault();
        select(next);
        next.focus();
      });
    }
  }
}

/** The tab `move` reaches from the one at `index`, past any that is disabled. */
function nextTab(
  tabs: readonly HTMLElement[],
  index: number,
  move: ((index: number, count: number) => number) | undefined,
): HTMLElement | undefined {
  if (move === undefined) return undefined;
  let at = index;
  for (const _ of tabs) {
    at = move(at, tabs.length);
    const tab = tabs[at];
    if (tab && !(tab as HTMLButtonElement).disabled) return tab;
  }
  return undefined;
}

function showTab(tab: HTMLElement, shown: boolean): void {
  tab.setAttribute("aria-selected", String(shown));
  tab.tabIndex = shown ? 0 : -1;
  const panel = tab.ownerDocument.getElementById(tab.getAttribute("aria-controls") ?? "");
  if (panel) reveal(panel, shown);
}

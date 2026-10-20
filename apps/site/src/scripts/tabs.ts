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
 * tab is in the Tab order.
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
        const move = MOVES[event.key];
        const next = move && tabs[move(index, tabs.length)];
        if (!next) return;
        event.preventDefault();
        select(next);
        next.focus();
      });
    }
  }
}

function showTab(tab: HTMLElement, shown: boolean): void {
  tab.setAttribute("aria-selected", String(shown));
  tab.tabIndex = shown ? 0 : -1;
  const panel = tab.ownerDocument.getElementById(tab.getAttribute("aria-controls") ?? "");
  if (panel) reveal(panel, shown);
}

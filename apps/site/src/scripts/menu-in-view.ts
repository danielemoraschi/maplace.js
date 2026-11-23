/** A side column pinned whole (`PinnedColumn.astro`), scrolling within itself. */
const PINNED_COLUMN = "[data-pinned-column]";

/**
 * Scrolls each pinned column, and only the column, to centre the page shown when it lies outside
 * the column's view: a Styling example's link sits below the fold of a list as tall as the
 * examples'. The column's own `scrollTop`, not `scrollIntoView`, which would move the page too
 * (`nav-in-view.ts`).
 */
export function showCurrentInPinnedColumn(root: ParentNode): void {
  for (const column of root.querySelectorAll<HTMLElement>(PINNED_COLUMN)) {
    const current = column.querySelector('[aria-current="page"]');
    if (current !== null) centreIfHidden(column, current);
  }
}

function centreIfHidden(column: HTMLElement, link: Element): void {
  const view = column.getBoundingClientRect();
  const box = link.getBoundingClientRect();
  if (box.top >= view.top && box.bottom <= view.bottom) return;
  const offset = box.top - view.top + column.scrollTop;
  column.scrollTop = offset - (view.height - box.height) / 2;
}

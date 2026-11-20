/** The side column's pages' list pinned alone (`PageColumns.astro`), scrolling within itself. */
const PINNED_NAV = "[data-pinned-nav]";

/**
 * Scrolls each pinned list, and only the list, to centre the page shown when it lies outside the
 * list's view: a Styling example's link sits below the fold of a list as tall as the examples'. The
 * list's own `scrollTop`, not `scrollIntoView`, which would move the page too (`nav-in-view.ts`).
 */
export function showCurrentInPinnedNav(root: ParentNode): void {
  for (const nav of root.querySelectorAll<HTMLElement>(PINNED_NAV)) {
    const current = nav.querySelector('[aria-current="page"]');
    if (current !== null) centreIfHidden(nav, current);
  }
}

function centreIfHidden(nav: HTMLElement, link: Element): void {
  const view = nav.getBoundingClientRect();
  const box = link.getBoundingClientRect();
  if (box.top >= view.top && box.bottom <= view.bottom) return;
  const offset = box.top - view.top + nav.scrollTop;
  nav.scrollTop = offset - (view.height - box.height) / 2;
}

/** The header nav's links: on a narrow screen it scrolls sideways under an end fade. */
const NAV_LINK = "header nav a";

/**
 * `link` scrolled clear of its nav's edges and end fade, as far as it needs. The nav alone: a
 * browser's `scrollIntoView` also honours the page's `scroll-padding-top`, and a link in a sticky
 * header always sits inside that, so it would move the page off the anchor it landed on.
 */
function bringIntoNav(link: Element): void {
  const nav = link.closest("nav");
  if (nav === null) return;
  const { left: navLeft, right: navRight } = nav.getBoundingClientRect();
  const clearEnd = navRight - Number.parseFloat(getComputedStyle(nav).paddingInlineEnd);
  const { left, right } = link.getBoundingClientRect();
  if (left < navLeft) nav.scrollBy({ left: left - navLeft });
  else if (right > clearEnd) nav.scrollBy({ left: right - clearEnd });
}

/** A nav link taking focus in view: a browser scrolls one only when it is out of view entirely. */
export function followNavFocus(root: Document): void {
  root.addEventListener("focusin", ({ target }) => {
    if (target instanceof Element && target.matches(NAV_LINK)) bringIntoNav(target);
  });
}

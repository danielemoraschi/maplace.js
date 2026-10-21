/** The header nav's links: on a narrow screen it scrolls sideways under an end fade. */
const NAV_LINK = "header nav a";

/** The link to the page shown, in the header's nav. */
const CURRENT_NAV_LINK = 'header nav [aria-current="page"]';

/**
 * The current page's link centred in its nav: a page past the nav's edge, or under its end fade,
 * would hide its own link. The page itself stays put.
 */
export function revealCurrentNavLink(root: ParentNode): void {
  root.querySelector(CURRENT_NAV_LINK)?.scrollIntoView({ block: "nearest", inline: "center" });
}

/**
 * A nav link that takes focus scrolled into the nav's view, clear of its scroll padding (the
 * fade): a browser scrolls a link only when it is out of view entirely, not under the fade.
 */
export function followNavFocus(root: Document): void {
  root.addEventListener("focusin", ({ target }) => {
    if (target instanceof Element && target.matches(NAV_LINK)) {
      target.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  });
}

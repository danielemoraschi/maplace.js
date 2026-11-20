import { findGroupAtPath, findGroupOfSection, groupPath } from "../examples/example-sections.ts";
import { HOME_ROUTE } from "../examples/home-page.ts";

/**
 * The page an old link to an example now goes to, when the page it names no longer holds it: an
 * example on the home page (`/#route`, before W63) or on an examples' page that gave it to another
 * (`/examples/lists/#search`), redirected there when the old page is gone (`_redirects`). Only the
 * home page's and the examples' pages' links: another page's own anchor, a heading sharing an
 * example's name (`/locations/#markers`), stays. The hash is compared raw: a stray `%` names no
 * example.
 */
export function pageForAnchor(hash: string, path: string): string | undefined {
  if (path !== HOME_ROUTE && findGroupAtPath(path) === undefined) return undefined;
  const group = findGroupOfSection(hash.slice(1));
  if (group === undefined || groupPath(group) === path) return undefined;
  return groupPath(group);
}

/** Sends the page to where its old example link now goes, if it does, its query and hash kept. */
export function followSectionAnchor(location: Location): void {
  const page = pageForAnchor(location.hash, location.pathname);
  if (page !== undefined) location.replace(`${page}${location.search}${location.hash}`);
}

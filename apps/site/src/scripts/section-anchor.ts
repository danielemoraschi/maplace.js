import { findGroupOfSection, groupPath, HOME_GROUP } from "../examples/example-sections.ts";

/**
 * The page an old link to an example on the home page (`/#route`) now goes to: the page of the
 * group holding it (W38). Only the home page's links, as every example was there; another page's own
 * anchor, a heading sharing an example's name (`/locations/#markers`), stays. The hash is
 * compared raw: a stray `%` names no example.
 */
export function pageForAnchor(hash: string, path: string): string | undefined {
  if (path !== groupPath(HOME_GROUP)) return undefined;
  const group = findGroupOfSection(hash.slice(1));
  if (group === undefined || group.id === HOME_GROUP.id) return undefined;
  return groupPath(group);
}

/** Sends the page to where its old example link now goes, if it does, its query and hash kept. */
export function followSectionAnchor(location: Location): void {
  const page = pageForAnchor(location.hash, location.pathname);
  if (page !== undefined) location.replace(`${page}${location.search}${location.hash}`);
}

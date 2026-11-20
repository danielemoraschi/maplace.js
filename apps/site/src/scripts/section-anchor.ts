import {
  EXAMPLE_PAGE_ENTRIES,
  type ExamplePageEntry,
  findGroupAtPath,
} from "../examples/example-sections.ts";
import { HOME_ROUTE } from "../examples/home-page.ts";

/**
 * Where an old link to an example now goes: an example's anchor on the home page (`/#route`, before
 * W63) or on a hub (`/examples/lists/#search`, the hubs once holding the examples; an old hub's
 * address is redirected to its successor by `_redirects`) goes to the example's own page. A bare
 * example name leaves no hash there; an anchor inside an example (its map, as link-to-place's
 * shared links write it: `#link-to-place-maplibre-map`) is kept. Only the home page's and the
 * hubs' links, and only an anchor the page doesn't hold (`holds`): a hub's own heading
 * (`#markers-from-the-locations-reference`), or another page's sharing an example's name
 * (`/locations/#markers`), stays. The hash is compared raw: a stray `%` names no example.
 */
export function pageForAnchor(
  hash: string,
  path: string,
  holds: (id: string) => boolean,
): string | undefined {
  if (path !== HOME_ROUTE && findGroupAtPath(path) === undefined) return undefined;
  const anchor = hash.slice(1);
  if (holds(anchor)) return undefined;
  const entry = exampleOfAnchor(anchor);
  if (entry === undefined) return undefined;
  return anchor === entry.section.name ? entry.path : `${entry.path}#${anchor}`;
}

/** Sends `document`'s page to where its old example link now goes, if it does, its query kept. */
export function followSectionAnchor(location: Location, document: Document): void {
  const address = pageForAnchor(location.hash, location.pathname, (id) =>
    Boolean(document.getElementById(id)),
  );
  if (address === undefined) return;
  const url = new URL(address, location.href);
  url.search = location.search;
  location.replace(url.href);
}

/** The example `anchor` names, or whose name and a `-` begin it: the longest such name. */
function exampleOfAnchor(anchor: string): ExamplePageEntry | undefined {
  const named = (name: string) => anchor === name || anchor.startsWith(`${name}-`);
  return EXAMPLE_PAGE_ENTRIES.filter(({ section }) => named(section.name)).reduce<
    ExamplePageEntry | undefined
  >(
    (longest, entry) =>
      longest === undefined || entry.section.name.length > longest.section.name.length
        ? entry
        : longest,
    undefined,
  );
}

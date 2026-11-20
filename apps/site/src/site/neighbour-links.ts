import type { NavLink } from "./nav-link.ts";

/** An item with the links to the items before and after it in its list. */
export interface WithNeighbours<Item> {
  readonly item: Item;
  readonly previous: NavLink | undefined;
  readonly next: NavLink | undefined;
}

/** Each of `items` with links to its neighbours: none before the first, or after the last. */
export function withNeighbours<Item>(
  items: readonly Item[],
  link: (item: Item) => NavLink,
): WithNeighbours<Item>[] {
  return items.map((item, index) => ({
    item,
    previous: index > 0 ? link(items[index - 1] as Item) : undefined,
    next: index < items.length - 1 ? link(items[index + 1] as Item) : undefined,
  }));
}

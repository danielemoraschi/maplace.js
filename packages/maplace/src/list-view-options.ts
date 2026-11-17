import type { Location, LocationState } from "./location";

/** One entry of a list view, as passed to a custom `render`. */
export interface ListEntry<Data = unknown> extends LocationState {
  readonly location: Location<Data>;
  /** With `sort: 'distance'` and an origin: metres from it, in a straight line. */
  readonly distance?: number | undefined;
  /** The distance as the list writes it. */
  readonly distanceLabel?: string | undefined;
}

export interface ListViewOptions<Data = unknown> {
  /** `list` (default) renders a listbox; `select` renders a native `<select>`. */
  readonly as?: "list" | "select" | undefined;
  /** Show group headings. Default true when any location has a `group`. */
  readonly groupHeadings?: boolean | undefined;
  /**
   * Shows after each group heading how many are listed under it now, following the filter and
   * `scope`: "North (3)". Off by default; refused with `groupHeadings: false`.
   */
  readonly groupCounts?: boolean | undefined;
  /** Adds a first entry to the list, which clears the selection and fits all locations. */
  readonly fitAll?: boolean | undefined;
  /** The words of the entry `fitAll` adds. Default "All locations"; nothing without `fitAll`. */
  readonly fitAllLabel?: string | undefined;
  /**
   * The list's accessible name. Default the `heading`, else "Locations"; or label `element` from
   * the page.
   */
  readonly label?: string | undefined;
  /** A visible heading above the entries; the list's accessible name unless `label` is given. */
  readonly heading?: string | undefined;
  /**
   * Custom entry content for `as: 'list'`, re-run only for entries whose location object or state
   * changed; the view keeps keyboard, focus and ARIA handling. Return a non-interactive node for
   * this entry alone (it sits inside an option): fresh, or the same one each time for its id. Not
   * for `as: 'select'`, whose options hold text.
   */
  readonly render?: ((entry: ListEntry<Data>) => Node) | undefined;
  /**
   * `viewport`: a switch above the entries, "All" and "This area", always shown. "All" (at load)
   * lists every location; "This area" lists those in the map's view (a shape when any of its
   * points is) and follows it, listing again on each new view (a resize isn't one) and with no
   * view (not attached, not laid out) every location until one comes. For `as: 'list'` only.
   */
  readonly scope?: "viewport" | undefined;
  /**
   * `distance`: once the store has an origin (`setOrigin`), nearest first, within each group, and
   * each entry says how far.
   */
  readonly sort?: "distance" | undefined;
  /** What a distance is written in. Default `kilometer`. */
  readonly distanceUnit?: "kilometer" | "mile" | undefined;
  /** The words of the `scope` switch's button listing only the map's view. Default "This area". */
  readonly areaOnlyLabel?: string | undefined;
  /** The words of the `scope` switch's button that lists every location. Default "All". */
  readonly showAllLabel?: string | undefined;
  /**
   * What a list with `scope` says when no location is in the map's view.
   * Default "No locations in this area".
   */
  readonly emptyAreaLabel?: string | undefined;
  /**
   * Shows a search box above the entries, for `as: 'list'` only: typing sets the filter's `query`
   * once it pauses for 150 ms, keeping the rest of the filter, so the map narrows too and the
   * camera stays.
   * It follows the store, emptying when a page's `setFilter` takes the query away, and a query
   * outlives the box.
   */
  readonly search?: boolean | undefined;
  /** The search box's placeholder and accessible name. Default "Search"; nothing without `search`. */
  readonly searchLabel?: string | undefined;
  /** What the line under the search box says when nothing matches. Default "No locations match". */
  readonly noMatchesLabel?: string | undefined;
  /** What the line under the search box says before the match count. Default "Locations found". */
  readonly matchesLabel?: string | undefined;
  /**
   * A button above the list ("Groups 9/10") opening a checkbox for each group, subgroups nested
   * under their parent's: ticking or
   * unticking one sets the filter's groups, keeping its query and tags. A location without a group
   * shows only while every box is ticked, and a partly ticked group hides its own entries (those
   * whose path ends at it). Needs `as: 'list'`.
   */
  readonly groupFilter?: boolean | undefined;
  /** The boxes' accessible name, with `groupFilter`. Default "Groups". */
  readonly groupFilterLabel?: string | undefined;
}

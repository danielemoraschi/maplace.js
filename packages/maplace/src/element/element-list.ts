import { type Adapter, CONTROL_POSITIONS, type ControlPosition } from "../adapter";
import { adoptCarriedStyles } from "../adopted-styles";
import { type ListViewOptions, listedLocations, type Maplace } from "../index";
import { booleanOrRaw } from "./attribute-values";
import { PLACED_LIST_CLASS } from "./default-styles";
import { elementMisuse } from "./element-error";
import type { ElementListOptions, ListPosition } from "./index";
import { buildListView } from "./list-views";

/** The attributes the list is built from; a change of any of them builds it again. */
export const LIST_ATTRIBUTES = [
  "list",
  "list-position",
  "fit-all-label",
  "list-heading",
  "group-counts",
  "list-scope",
  "area-only-label",
  "show-all-label",
  "empty-area-label",
  "search-label",
  "no-matches-label",
  "matches-label",
] as const;

const LIST_ATTRIBUTE_NAMES: ReadonlySet<string> = new Set(LIST_ATTRIBUTES);

/** Whether a change of `name` builds the list again; other attributes the element observes don't. */
export function isListAttribute(name: string): boolean {
  return LIST_ATTRIBUTE_NAMES.has(name);
}

const CORNERS: readonly string[] = Object.keys(CONTROL_POSITIONS);

/** The element's list, beside the map or on it. */
export interface ElementList {
  /** Puts the list on `adapter`'s map when it goes in a corner; returns what takes it off. */
  showOn(adapter: Adapter): () => void;
  /** Puts a list beside the map back, when the page replaced the element's children. */
  restore(): void;
  destroy(): void;
}

/**
 * The list view `host`'s `list` names, built from its list options and placed by `list-position`,
 * or none without `list`. One beside the map is placed at once, so it shows before the map loads;
 * one on the map waits for `showOn`.
 */
export function listFromAttributes(host: HTMLElement, store: Maplace): ElementList | undefined {
  const name = host.getAttribute("list");
  if (name === null) return undefined;
  // Checked before the page's view is built, so a refused list leaves nothing to destroy.
  const position = listPosition(host.getAttribute("list-position"));
  const setup = {
    options: listOptionsOf(host, name),
    listed: () => listedLocations(store.getSnapshot()),
  };
  const view = buildListView(name, store, setup);
  view.element.classList.add(PLACED_LIST_CLASS);
  const restore = () => {
    if (position !== "outside") return;
    adoptCarriedStyles(host.ownerDocument);
    if (view.element.parentNode !== host) host.append(view.element);
  };
  restore();
  return {
    showOn: (adapter) =>
      position === "outside" ? () => {} : adapter.mountControl(view.element, position),
    restore,
    destroy() {
      // A view of the page's that leaves its element would stay beside the list built again.
      try {
        view.destroy();
      } finally {
        view.element.remove();
      }
    },
  };
}

function listOptionsOf(host: HTMLElement, name: string): ElementListOptions {
  return {
    fitAllLabel: textOf(host, "fit-all-label"),
    heading: textOf(host, "list-heading"),
    groupCounts: groupCounts(host),
    scope: listScope(host, name),
    areaOnlyLabel: textOf(host, "area-only-label"),
    showAllLabel: textOf(host, "show-all-label"),
    emptyAreaLabel: textOf(host, "empty-area-label"),
    searchLabel: searchLabel(host, name),
    noMatchesLabel: textOf(host, "no-matches-label"),
    matchesLabel: textOf(host, "matches-label"),
  };
}

/** `name`'s text, refused when blank: for every view, the page's own as maplace's. */
function textOf(host: HTMLElement, name: string): string | undefined {
  const text = host.getAttribute(name) ?? undefined;
  if (text?.trim() === "") throw elementMisuse(`${name} must not be blank`, { field: name });
  return text;
}

/** `group-counts`, as HTML writes a boolean. */
function groupCounts(host: HTMLElement): boolean | undefined {
  const value = booleanOrRaw(host, "group-counts");
  if (typeof value !== "string") return value;
  throw elementMisuse(`group-counts must be true or false, got "${value}"`, {
    field: "group-counts",
  });
}

/** `search-label`, for a list with room for its box. */
function searchLabel(host: HTMLElement, name: string): string | undefined {
  const label = textOf(host, "search-label");
  if (label !== undefined && name === "select") {
    throw elementMisuse('search-label needs a list: list="select" is a native select', {
      field: "search-label",
    });
  }
  return label;
}

/** Beside the map unless a corner is named. */
function listPosition(value: string | null): ListPosition {
  if (value === null || value === "outside") return "outside";
  if (CORNERS.includes(value)) return value as ControlPosition;
  throw elementMisuse(`list-position must be a corner or "outside", got "${value}"`, {
    field: "list-position",
  });
}

/** `list-scope`: `viewport`, for a list with room for its "All" and "This area" switch. */
function listScope(host: HTMLElement, name: string): ListViewOptions["scope"] {
  const value = host.getAttribute("list-scope");
  if (value === null) return undefined;
  const field = { field: "list-scope" };
  if (name === "select") {
    throw elementMisuse('list-scope needs a list: list="select" is a native select', field);
  }
  if (value === "viewport") return value;
  throw elementMisuse(`list-scope must be "viewport", got "${value}"`, field);
}

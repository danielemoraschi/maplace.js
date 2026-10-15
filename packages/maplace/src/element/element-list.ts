import { type Adapter, CONTROL_POSITIONS, type ControlPosition } from "../adapter";
import { createListView, type Maplace } from "../index";
import { elementMisuse } from "./element-error";
import type { ListPosition } from "./index";

/** The attributes the list is built from; a change of any of them builds it again. */
export const LIST_ATTRIBUTES = ["list", "list-position", "fit-all-label"] as const;

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
 * The list `host`'s `list`, `list-position` and `fit-all-label` ask for, or none without `list`.
 * One beside the map is placed at once, so it shows before the map loads; one on the map waits for
 * `showOn`.
 */
export function listFromAttributes(host: HTMLElement, store: Maplace): ElementList | undefined {
  const kind = host.getAttribute("list");
  if (kind === null) return undefined;
  const as = listKind(kind);
  const position = listPosition(host.getAttribute("list-position"));
  const fitAllLabel = host.getAttribute("fit-all-label") ?? undefined;
  const view = createListView(store, { as, fitAllLabel });
  const restore = () => {
    if (position === "outside" && view.element.parentNode !== host) host.append(view.element);
  };
  restore();
  return {
    showOn: (adapter) =>
      position === "outside" ? () => {} : adapter.mountControl(view.element, position),
    restore,
    destroy: () => view.destroy(),
  };
}

function listKind(value: string): "list" | "select" {
  if (value === "") return "list";
  if (value === "select") return "select";
  throw elementMisuse(`list must be empty (a list) or "select", got "${value}"`, { field: "list" });
}

/** Beside the map unless a corner is named. */
function listPosition(value: string | null): ListPosition {
  if (value === null || value === "outside") return "outside";
  if (CORNERS.includes(value)) return value as ControlPosition;
  throw elementMisuse(`list-position must be a corner or "outside", got "${value}"`, {
    field: "list-position",
  });
}

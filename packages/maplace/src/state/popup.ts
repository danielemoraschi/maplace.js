import type { ResolvedPopupOptions } from "../popup";
import type { Snapshot } from "../store";
import { andThen, type Change, NO_CHANGE } from "./change";
import { isUnselectableId } from "./lookup";
import { deselect } from "./selection";

/** What the map reports once a popup's content is in the DOM. */
export interface PopupOpenReport {
  readonly id: string;
  readonly element: HTMLElement;
}

/** `popupOpen`, unless the store no longer shows the location (a race with a diff being drawn). */
export function popupOpened<Data>(
  snapshot: Snapshot<Data>,
  { id, element }: PopupOpenReport,
): Change<Data> {
  if (isUnselectableId(snapshot, id)) return NO_CHANGE;
  return { patch: {}, events: [{ name: "popupOpen", payload: { id, element } }] };
}

/** What the map reports when a popup closes, with the store's `popup.openOn`. */
export interface PopupCloseReport {
  readonly id: string;
  readonly openOn: ResolvedPopupOptions["openOn"];
}

/**
 * `popupClose`, even for a location that is gone: removing a location closes its popup, and
 * that close pairs with the `popupOpen` listeners already had. With `openOn: 'click'` the popup
 * is the selection's, so closing the selected location's popup also deselects (RFC §3).
 */
export function popupClosed<Data>(
  snapshot: Snapshot<Data>,
  { id, openOn }: PopupCloseReport,
): Change<Data> {
  const closed: Change<Data> = { patch: {}, events: [{ name: "popupClose", payload: { id } }] };
  const deselects = openOn === "click" && id === snapshot.selectedId;
  return deselects ? andThen<Data>(snapshot, closed, deselect) : closed;
}

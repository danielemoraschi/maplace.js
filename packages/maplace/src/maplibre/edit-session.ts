import { editReportsFor } from "../adapter-kit/edit-reports";
import { sameGeometry, sameList } from "../adapter-kit/same-geometry";
import type { Geometry } from "../geometry";
import { editedBy, type HandlePlace, handlePlacesOf, sameRole } from "./edit-geometry";
import {
  type EditedShape,
  type EditHandle,
  type HandleOwner,
  handleAt,
  moveHandle,
  placeHandle,
  removeHandle,
} from "./edit-handles";

/** One shape's editing: its handles, kept on the geometry it shows. */
export interface ShapeEditing {
  /** Puts the handles on `geometry`, unless they show it already (the store's write-back). */
  follow(geometry: Geometry): void;
  /** The handles on the map now. */
  handles(): readonly EditHandle[];
  /** A drag is under way: a handle has moved and not been let go. */
  isDragging(): boolean;
  /** Takes every handle off, and a drag under way back to where it started. */
  stop(): void;
}

/** Where a shape is edited, and how it shows each edit. */
export interface EditSite extends EditedShape {
  /** Draws the shape as `geometry`: each step of a drag, and where the drop leaves it. */
  onEdit(geometry: Geometry): void;
}

/**
 * Handles on `geometry` a user drags to edit it, as Google's: each step of a drag drawn and
 * reported as an edit, the drop as the change. Every edit is worked out from the geometry before
 * the drag, so the steps never compound. A drag that leaves the shape as it was reports no
 * change, and the store's copy of an edit, compared by value, moves no handle.
 */
export function editShape(geometry: Geometry, site: EditSite): ShapeEditing {
  const owner: HandleOwner = { ...site, drags: { moved, dropped } };
  const reports = editReportsFor(site.id, site.mounted.live);
  let shown = geometry;
  let handles: EditHandle[] = [];
  /** A drag is under way: it has moved a handle, and not let go. */
  let dragging = false;
  /** This drag reported an edit: a step back to where it started is reported too. */
  let reportedThisDrag = false;
  showHandles(handlePlacesOf(shown));

  const isEdit = (edited: Geometry) => !sameGeometry(edited, shown);
  const editedWith = (handle: EditHandle) => editedBy(shown, handle.role, handleAt(handle));

  /**
   * The handles at `places`: moved where they are the same handles, else placed anew, as after
   * a midpoint's drop adds a point. The handle held, `held`, is left where the pointer has it.
   */
  function showHandles(places: readonly HandlePlace[], held?: EditHandle): void {
    if (fits(places)) {
      handles.forEach((handle, index) => {
        const place = places[index];
        if (handle !== held && place !== undefined) moveHandle(handle, place.at);
      });
      return;
    }
    cutDragShort();
    removeAll();
    handles = places.map((place) => placeHandle(place, owner));
  }

  function fits(places: readonly HandlePlace[]): boolean {
    return sameList<HandlePlace | EditHandle>(places, handles, (a, b) => sameRole(a.role, b.role));
  }

  /**
   * A drag whose handle is taken off never ends: it edits nothing, and the next drag reports
   * afresh.
   */
  function cutDragShort(): void {
    if (!dragging) return;
    dragging = false;
    reportedThisDrag = false;
    reports.endedUnchanged();
  }

  function removeAll(): void {
    for (const handle of handles) removeHandle(handle, owner);
    handles = [];
  }

  // Each step reports last: a page's listener runs inside the report, and may stop the editing
  // (destroying the map), so nothing is placed after it.
  function moved(handle: EditHandle): void {
    const edited = editedWith(handle);
    dragging = true;
    site.onEdit(edited);
    // A midpoint's drag adds a point: the other handles wait for the drop.
    if (handle.role.kind !== "midpoint") showHandles(handlePlacesOf(edited), handle);
    if (isEdit(edited) || reportedThisDrag) {
      reportedThisDrag = true;
      reports.moving(edited);
    }
  }

  function dropped(handle: EditHandle): void {
    const edited = editedWith(handle);
    const changed = isEdit(edited);
    dragging = false;
    reportedThisDrag = false;
    if (changed) shown = edited;
    site.onEdit(shown);
    // Back on its place too when the drag edited nothing: a radius handle on its bearing.
    showHandles(handlePlacesOf(shown));
    if (changed) reports.ended(edited);
    else reports.endedUnchanged();
  }

  return {
    follow(next) {
      if (sameGeometry(next, shown)) return;
      shown = next;
      showHandles(handlePlacesOf(next));
    },
    handles: () => handles,
    isDragging: () => dragging,
    stop() {
      removeAll();
      // A drag cut short (the shape hidden or no longer editable) never ended: it edits nothing.
      if (dragging) site.onEdit(shown);
      cutDragShort();
    },
  };
}

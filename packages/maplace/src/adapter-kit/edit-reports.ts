import type { AdapterHost } from "../adapter";
import type { Geometry } from "../geometry";
import { sameGeometry } from "./same-geometry";

/** A user's edit of one location, as reports to the host. */
export interface EditReports {
  /** The geometry so far, while the drag or reshape is under way; a repeat reports nothing. */
  moving(geometry: Geometry): void;
  /** Where it ended: an edit there, unless the last one already was, then the change. */
  ended(geometry: Geometry): void;
  /**
   * It ended leaving the location as it was: no change, and the next edit is reported whatever
   * this one's last was.
   */
  endedUnchanged(): void;
}

/**
 * One location's edits, holding the rule every adapter keeps: the last edit reported is where the
 * edit ended, so a page listening to edits alone sees the end too. `host` is read at each report,
 * and gives nothing once the map stops reporting.
 */
export function editReportsFor(id: string, host: () => AdapterHost | undefined): EditReports {
  let lastEdit: Geometry | undefined;
  const moving = (geometry: Geometry): void => {
    if (lastEdit !== undefined && sameGeometry(lastEdit, geometry)) return;
    lastEdit = geometry;
    host()?.reportLocationEdit(id, geometry);
  };
  const ended = (geometry: Geometry): void => {
    moving(geometry);
    lastEdit = undefined;
    host()?.reportLocationChange(id, geometry);
  };
  const endedUnchanged = (): void => {
    lastEdit = undefined;
  };
  return { moving, ended, endedUnchanged };
}

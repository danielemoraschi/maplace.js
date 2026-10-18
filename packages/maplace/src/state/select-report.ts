import type { Snapshot } from "../store";
import { child, root } from "../validate/fail";
import { checkString } from "../validate/values";
import { type Change, NO_CHANGE } from "./change";
import { isHiddenId } from "./lookup";
import { selectShown } from "./selection";

const ID = child(root("reportSelectionChange"), "id");

/**
 * A click on a location, which always pans (RFC §4). An id the store no longer shows is a race
 * with a diff still being drawn: no change. A report without an id is the adapter's bug and
 * throws: a click on the map is `reportMapClick`.
 */
export function selectReported<Data>(snapshot: Snapshot<Data>, id: string): Change<Data> {
  checkString(id, ID);
  return isHiddenId(snapshot, id) ? NO_CHANGE : selectShown(snapshot, id);
}

import { frozenPoint } from "../diff/frozen";
import type { LatLng } from "../geometry";
import type { Snapshot } from "../store";
import { child, root } from "../validate/fail";
import { checkLatLng } from "../validate/geometry";
import { andThen, type Change } from "./change";
import { deselectIfSelected } from "./selection";

const POSITION = child(root("reportMapClick"), "position");

/**
 * A click on the map itself, as the map reports it: `mapClick` with where, then the selection
 * cleared, as a click off every location always did. A position no map shows is the adapter's
 * bug and throws.
 */
export function mapClicked<Data>(snapshot: Snapshot<Data>, position: LatLng): Change<Data> {
  checkLatLng(position, POSITION);
  const clicked: Change<Data> = {
    patch: {},
    events: [{ name: "mapClick", payload: { position: frozenPoint(position) } }],
  };
  return andThen(snapshot, clicked, deselectIfSelected);
}

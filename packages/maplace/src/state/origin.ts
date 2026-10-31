import { frozenPoint } from "../diff/frozen";
import type { LatLng } from "../geometry";
import type { Snapshot } from "../store";
import { child, root } from "../validate/fail";
import { checkLatLng } from "../validate/geometry";
import { type Change, NO_CHANGE, patchOnly } from "./change";

/** Where distances are measured from, any point on the map, or none with `undefined`. */
export function setOrigin<Data>(
  { origin: current }: Snapshot<Data>,
  origin: LatLng | undefined,
): Change<Data> {
  if (origin === undefined) return current === undefined ? NO_CHANGE : patchOnly({ origin });
  checkLatLng(origin, child(root("setOrigin"), "origin"));
  if (current?.lat === origin.lat && current.lng === origin.lng) return NO_CHANGE;
  return patchOnly({ origin: frozenPoint(origin) });
}

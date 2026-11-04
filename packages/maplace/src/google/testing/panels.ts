import { onTestFinished } from "vitest";
import type { ControlPosition } from "../../adapter";
import type { Attachable } from "../../testing/attachable";
import { panelOf } from "../../testing/panel-of";
import { settledOnMap } from "./controls-placed";
import {
  type ErrorReporting,
  type Fittable,
  fitted,
  onGoogle,
  type StoreSite,
} from "./store-on-google";

/** A list view as far as putting it on a map goes. */
interface MountableList {
  readonly element: HTMLElement;
  destroy(): void;
}

interface ListOnGoogle extends StoreSite {
  readonly maplace: Attachable & ErrorReporting & Fittable;
  readonly list: MountableList;
  /** The corner, top-left unless given. */
  readonly position?: ControlPosition | undefined;
}

/**
 * `list` in a corner (top-left unless given) of the Google map `maplace` is attached and fitted to,
 * once Google laid it out, and destroyed after the test: the adapter, the map's container, the panel
 * holding the list, and how to take the list off the map.
 */
export async function listMountedOnGoogle({
  maplace,
  list,
  position = "top-left",
  ...site
}: ListOnGoogle) {
  onTestFinished(() => list.destroy());
  const { adapter, container } = await onGoogle(maplace, site);
  await fitted(maplace);
  const remove = adapter.mountControl(list.element, position);
  await settledOnMap(list.element);
  return { adapter, container, panel: panelOf(list.element), remove };
}

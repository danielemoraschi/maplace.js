import { onTestFinished } from "vitest";
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
}

/**
 * `list` in the top-left corner of the Google map `maplace` is attached and fitted to, once Google
 * laid it out, and destroyed after the test: the map's container, the panel holding the list,
 * and how to take the list off the map.
 */
export async function listMountedOnGoogle({ maplace, list, ...site }: ListOnGoogle) {
  onTestFinished(() => list.destroy());
  const { adapter, container } = await onGoogle(maplace, site);
  await fitted(maplace);
  const remove = adapter.mountControl(list.element, "top-left");
  await settledOnMap(list.element);
  return { container, panel: panelOf(list.element), remove };
}

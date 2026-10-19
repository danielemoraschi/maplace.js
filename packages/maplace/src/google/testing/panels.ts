import { onTestFinished } from "vitest";
import { CONTROL_CLASS } from "../control-styles";
import { settledOnMap } from "./controls-placed";
import {
  type Attachable,
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
  readonly maplace: Attachable & Fittable;
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

/** The panel holding `node` on the map. */
export function panelOf(node: Element): HTMLElement {
  const panel = node.closest<HTMLElement>(`.${CONTROL_CLASS}`);
  if (panel === null) throw new Error("no panel around the node");
  return panel;
}

/** The first element inside `root` matching `selector`, failing when there is none. */
export function queried(root: Element, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`nothing matches ${selector}`);
  return found;
}

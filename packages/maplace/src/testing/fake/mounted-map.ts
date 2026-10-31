import type { AdapterHost, MountContext } from "../../adapter";
import type { MapState } from "./map-state";
import { createPopups, type FakePopups } from "./popups";

/** A mounted fake map whose load wasn't cancelled: whom it reports to, and its popup. */
export interface LiveMap {
  readonly host: AdapterHost;
  readonly popups: FakePopups;
}

/** The fake map once mounted: the element it draws in, and whom it reports to while live. */
export interface MountedMap {
  readonly layer: HTMLElement | undefined;
  /** Undefined once the load was cancelled: nothing reports then. */
  live(): LiveMap | undefined;
}

export function mountMap(context: MountContext, map: MapState): MountedMap {
  const layer = layerIn(context.container);
  const popups = createPopups({ map, host: context.host, openOn: context.popup.openOn, layer });
  const live: LiveMap = { host: context.host, popups };
  return {
    layer,
    // A cancelled load reports nothing: the store has moved on from this map.
    live: () => (context.signal.aborted ? undefined : live),
  };
}

/**
 * The element the fake map draws in, placed in the container. Tests without a DOM pass a
 * stand-in container (`testing/container.ts`): the map then has no element, which only popups
 * and controls need.
 */
function layerIn(container: HTMLElement): HTMLElement | undefined {
  if (typeof container.querySelector !== "function") return undefined;
  const layer = container.ownerDocument.createElement("div");
  container.append(layer);
  return layer;
}

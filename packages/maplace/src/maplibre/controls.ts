import type { IControl, Map as MapLibreMap } from "maplibre-gl";
import type { Adapter, ControlPosition } from "../adapter";
import type { MapPart } from "./mounted-map";

/** The adapter's on-map controls: a part on the open map, and `mountControl`. */
export interface Controls extends Pick<Adapter, "mountControl"> {
  readonly part: MapPart;
  /**
   * The adapter is destroyed: controls still queued are dropped, and later ones leave the page's
   * node where it is, as nothing will show them.
   */
  release(): void;
}

/** A page's control, and the corner it goes in: on the map, or waiting for it to open. */
interface QueuedControl {
  readonly control: IControl;
  readonly position: ControlPosition;
}

/**
 * The page's nodes on the map, each through MapLibre's own control mechanism, in the corner asked
 * for (maplace's corner names are MapLibre's). One mounted before the map opens waits for it; its
 * remover takes it off the map, or out of the queue.
 */
export function createControls(): Controls {
  const controls = new Set<QueuedControl>();
  let map: MapLibreMap | undefined;
  let destroyed = false;

  return {
    part: {
      open(mounted) {
        const opened = mounted.map;
        map = opened;
        for (const { control, position } of controls) opened.addControl(control, position);
        mounted.onDestroy(() => {
          for (const { control } of controls) opened.removeControl(control);
          map = undefined;
        });
      },
    },
    mountControl(node, position) {
      if (destroyed) return () => {};
      const entry = { control: controlHolding(node), position };
      controls.add(entry);
      map?.addControl(entry.control, position);
      return () => {
        if (!controls.delete(entry)) return;
        map?.removeControl(entry.control);
      };
    },
    release() {
      destroyed = true;
      controls.clear();
    },
  };
}

/** A control showing `node` as it is, in an element of maplace's MapLibre lays out. */
function controlHolding(node: HTMLElement): IControl {
  let holder: HTMLElement | undefined;
  return {
    onAdd(map) {
      holder = map.getContainer().ownerDocument.createElement("div");
      holder.className = "maplibregl-ctrl";
      holder.append(node);
      return holder;
    },
    onRemove() {
      holder?.remove();
      holder = undefined;
    },
  };
}

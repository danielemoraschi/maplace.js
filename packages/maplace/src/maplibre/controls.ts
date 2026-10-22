import type { IControl, Map as MapLibreMap } from "maplibre-gl";
import type { Adapter, ControlPosition } from "../adapter";
import { panelControl } from "./control-panel";
import type { MapPart } from "./mounted-map";

/** The adapter's on-map controls: a part on the open map, and `mountControl`. */
export interface Controls extends Pick<Adapter, "mountControl"> {
  readonly part: MapPart;
  /**
   * The adapter is destroyed, its map opened or not: later controls leave the page's node where it
   * is, as nothing will show them. Closing the map took the others off.
   */
  release(): void;
}

/** A page's node on the map: the control MapLibre holds it by, and its corner. */
interface MountedControl {
  readonly control: IControl;
  readonly position: ControlPosition;
}

/**
 * The page's nodes on the map, each in its panel (`control-panel.ts`) through MapLibre's own
 * control mechanism, in the corner asked for (maplace's corner names are MapLibre's). One mounted
 * before the map opens waits for it; a node mounted again moves to its new corner; its remover
 * takes it off the map and out of the page.
 */
export function createControls(): Controls {
  const byNode = new Map<HTMLElement, MountedControl>();
  let map: MapLibreMap | undefined;
  let destroyed = false;

  function place({ control, position }: MountedControl): void {
    map?.addControl(control, position);
  }

  function takeOff({ control }: MountedControl): void {
    map?.removeControl(control);
  }

  /** Takes `node`'s control off and out of the page, unless the node was mounted again since. */
  function remove(node: HTMLElement, mounted: MountedControl): void {
    if (byNode.get(node) !== mounted) return;
    byNode.delete(node);
    takeOff(mounted);
    node.remove();
  }

  return {
    part: {
      open(opened) {
        map = opened.map;
        for (const mounted of byNode.values()) place(mounted);
        opened.onDestroy(() => {
          for (const mounted of byNode.values()) takeOff(mounted);
          map = undefined;
        });
      },
    },
    mountControl(node, position) {
      if (destroyed) return () => {};
      const previous = byNode.get(node);
      if (previous) takeOff(previous);
      const mounted = { control: panelControl(node), position };
      byNode.set(node, mounted);
      place(mounted);
      return () => remove(node, mounted);
    },
    release() {
      destroyed = true;
    },
  };
}

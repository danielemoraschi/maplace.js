import type { IControl, Map as MapLibreMap } from "maplibre-gl";
import { CONTROL_POSITIONS, type ControlPosition } from "../../adapter";
import { createTeardowns } from "../../adapter-kit/teardowns";
import type { Controls } from "../controls";
import type { MountedMapLibre } from "../mounted-map";

/**
 * A map as the controls use one: MapLibre's four corners in its container, a control added to
 * one as MapLibre adds it (first in a bottom corner, last in a top one), and removed as MapLibre
 * removes it, by its own `onRemove`.
 */
function stubControlMap() {
  const container = document.createElement("div");
  const corners = {} as Record<ControlPosition, HTMLElement>;
  for (const position of Object.keys(CONTROL_POSITIONS) as ControlPosition[]) {
    corners[position] = container.appendChild(document.createElement("div"));
  }
  const map = {
    getContainer: () => container,
    addControl(control: IControl, position: ControlPosition = "top-right") {
      const element = control.onAdd(map as unknown as MapLibreMap);
      const corner = corners[position];
      if (position.startsWith("bottom")) corner.prepend(element);
      else corner.append(element);
      return map;
    },
    removeControl(control: IControl) {
      control.onRemove(map as unknown as MapLibreMap);
      return map;
    },
  };
  const corner = (position: ControlPosition) => Array.from(corners[position].children);
  return { map, container, corner };
}

/**
 * `controls` opened on a stub map, as the adapter's parts are: what each corner holds, closing the
 * map, and destroying the adapter (the map closed, then the controls released, as `destroy` runs).
 */
export function openedControls(controls: Controls) {
  const { map, container, corner } = stubControlMap();
  const teardowns = createTeardowns();
  const mounted = { map, onDestroy: teardowns.add } as unknown as MountedMapLibre;
  controls.part.open(mounted);
  const close = () => teardowns.runAll();
  const destroy = () => {
    close();
    controls.release();
  };
  return { map, container, corner, close, destroy };
}
